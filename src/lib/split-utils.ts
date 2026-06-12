export interface SplitInput {
  userId: string;
  value?: number; // percentage value, share value, or specific amount owed
}

export interface CalculatedSplit {
  userId: string;
  amountOwed: number; // in cents
}

/**
 * Calculates equal splits among participants, distributing remainders 1 cent at a time.
 */
export function calculateEqualSplits(totalAmount: number, userIds: string[]): CalculatedSplit[] {
  if (userIds.length === 0) return [];
  
  const baseShare = Math.floor(totalAmount / userIds.length);
  const remainder = totalAmount - (baseShare * userIds.length);

  return userIds.map((userId, index) => {
    // Distribute remainder (1 cent) to the first 'remainder' users in the list
    const extra = index < remainder ? 1 : 0;
    return {
      userId,
      amountOwed: baseShare + extra
    };
  });
}

/**
 * Calculates unequal splits, validating that the sum of amounts equals the total amount.
 */
export function calculateUnequalSplits(totalAmount: number, splits: SplitInput[]): CalculatedSplit[] {
  const calculatedSplits = splits.map(s => ({
    userId: s.userId,
    amountOwed: Math.round(s.value || 0)
  }));

  const sum = calculatedSplits.reduce((acc, curr) => acc + curr.amountOwed, 0);
  if (sum !== totalAmount) {
    throw new Error(`The sum of unequal splits (${sum} cents) does not match the total expense amount (${totalAmount} cents).`);
  }

  return calculatedSplits;
}

/**
 * Calculates percentage splits and distributes the rounding remainder to the first participants.
 */
export function calculatePercentageSplits(totalAmount: number, splits: SplitInput[]): CalculatedSplit[] {
  if (splits.length === 0) return [];

  // Validate percentages sum to exactly 100%
  const totalPercentage = splits.reduce((acc, curr) => acc + (curr.value || 0), 0);
  // Allow a tiny margin of floating point error for validation
  if (Math.abs(totalPercentage - 100) > 0.01) {
    throw new Error(`The sum of percentages must equal exactly 100%. Currently it is ${totalPercentage}%.`);
  }

  const baseShares = splits.map(s => {
    const percentage = s.value || 0;
    // Calculate raw amount in cents
    return {
      userId: s.userId,
      amountOwed: Math.floor((totalAmount * percentage) / 100)
    };
  });

  const sumOfBaseShares = baseShares.reduce((acc, curr) => acc + curr.amountOwed, 0);
  const remainder = totalAmount - sumOfBaseShares;

  // Distribute remainder 1 cent at a time to the first participants in the list
  return baseShares.map((share, index) => {
    const extra = index < remainder ? 1 : 0;
    return {
      userId: share.userId,
      amountOwed: share.amountOwed + extra
    };
  });
}

/**
 * Calculates share-based splits (e.g. 2 shares, 1 share) and distributes remainders.
 */
export function calculateSharesSplits(totalAmount: number, splits: SplitInput[]): CalculatedSplit[] {
  if (splits.length === 0) return [];

  const totalShares = splits.reduce((acc, curr) => acc + (curr.value || 0), 0);
  if (totalShares <= 0) {
    throw new Error("Total shares must be greater than 0.");
  }

  const baseShares = splits.map(s => {
    const shareValue = s.value || 0;
    return {
      userId: s.userId,
      amountOwed: Math.floor((totalAmount * shareValue) / totalShares)
    };
  });

  const sumOfBaseShares = baseShares.reduce((acc, curr) => acc + curr.amountOwed, 0);
  const remainder = totalAmount - sumOfBaseShares;

  // Distribute remainder 1 cent at a time to the first participants in the list
  return baseShares.map((share, index) => {
    const extra = index < remainder ? 1 : 0;
    return {
      userId: share.userId,
      amountOwed: share.amountOwed + extra
    };
  });
}

/**
 * Form interface matching database queries for balance calculations
 */
export interface ExpenseData {
  id: string;
  amount: number;
  paidByUserId: string;
  splits: {
    userId: string;
    amountOwed: number;
  }[];
}

export interface SettlementData {
  id: string;
  payerUserId: string;
  receiverUserId: string;
  amount: number;
}

/**
 * Calculates the net balance for each member of a group.
 * Formula: Net Balance = Total Paid - Total Owed + Settlements Received - Settlements Paid
 */
export function calculateNetBalances(
  members: string[],
  expenses: ExpenseData[],
  settlements: SettlementData[]
): Record<string, number> {
  const netBalances: Record<string, number> = {};

  // Initialize all members with a 0 balance
  members.forEach(userId => {
    netBalances[userId] = 0;
  });

  // Calculate totals from expenses
  expenses.forEach(expense => {
    // Add paid amount to the payer's balance
    if (netBalances[expense.paidByUserId] !== undefined) {
      netBalances[expense.paidByUserId] += expense.amount;
    }

    // Subtract owed amount from each participant's balance
    expense.splits.forEach(split => {
      if (netBalances[split.userId] !== undefined) {
        netBalances[split.userId] -= split.amountOwed;
      }
    });
  });

  // Calculate totals from settlements
  settlements.forEach(settlement => {
    // Receiver gets money -> balance shifts positive
    if (netBalances[settlement.receiverUserId] !== undefined) {
      netBalances[settlement.receiverUserId] += settlement.amount;
    }

    // Payer gives money -> balance shifts negative (meaning they owe less / paid more)
    if (netBalances[settlement.payerUserId] !== undefined) {
      netBalances[settlement.payerUserId] -= settlement.amount;
    }
  });

  return netBalances;
}

export interface SuggestedPayment {
  fromUserId: string;
  toUserId: string;
  amount: number; // in cents
}

/**
 * Matches debtors to creditors sequentially to compute recommended payments to settle debts.
 */
export function matchDebts(netBalances: Record<string, number>): SuggestedPayment[] {
  const suggestedPayments: SuggestedPayment[] = [];

  // Split into creditors (> 0) and debtors (< 0)
  const creditors = Object.keys(netBalances)
    .filter(userId => netBalances[userId] > 0)
    .map(userId => ({ userId, balance: netBalances[userId] }))
    .sort((a, b) => b.balance - a.balance); // Sort descending

  const debtors = Object.keys(netBalances)
    .filter(userId => netBalances[userId] < 0)
    .map(userId => ({ userId, balance: Math.abs(netBalances[userId]) }))
    .sort((a, b) => b.balance - a.balance); // Sort descending

  let creditorIndex = 0;
  let debtorIndex = 0;

  while (creditorIndex < creditors.length && debtorIndex < debtors.length) {
    const creditor = creditors[creditorIndex];
    const debtor = debtors[debtorIndex];

    const amountToSettle = Math.min(creditor.balance, debtor.balance);

    if (amountToSettle > 0) {
      suggestedPayments.push({
        fromUserId: debtor.userId,
        toUserId: creditor.userId,
        amount: amountToSettle
      });

      creditor.balance -= amountToSettle;
      debtor.balance -= amountToSettle;
    }

    if (creditor.balance === 0) {
      creditorIndex++;
    }
    if (debtor.balance === 0) {
      debtorIndex++;
    }
  }

  return suggestedPayments;
}
