export const costs = [
  {
    name: "ChatGPT Plus",
    monthlyCost: 20,
    status: "Active",
  },
  {
    name: "Claude Pro",
    monthlyCost: 20,
    status: "Active",
  },
  {
    name: "Cursor",
    monthlyCost: 20,
    status: "Considering",
  }
];

export const totalMonthlyCost = costs.reduce(
  (sum, cost) => sum + cost.monthlyCost,
  0
);