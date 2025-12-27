/**
 * Data transformers to match frontend expected format
 */

export const transformSupplier = (supplier: any) => {
  return {
    id: supplier.id,
    code: supplier.id.substring(0, 6).toUpperCase(),
    supplier: supplier.name,
    avatar: supplier.logo || '/src/assets/img/supplier/supplier-01.png',
    email: supplier.email || '',
    phone: supplier.phone || '',
    country: supplier.country || '',
    status: supplier.isActive ? 'Active' : 'Inactive',
  };
};

export const transformCustomer = (customer: any) => {
  return {
    id: customer.id,
    code: customer.id.substring(0, 6).toUpperCase(),
    customer: customer.name,
    avatar: '/src/assets/img/users/user-01.jpg',
    email: customer.email || '',
    phone: customer.phone || '',
    country: customer.country || '',
    status: customer.isActive ? 'Active' : 'Inactive',
  };
};

export const transformPurchase = (purchase: any) => {
  return {
    id: purchase.id,
    supplierName: purchase.supplier?.name || 'N/A',
    reference: purchase.referenceNumber || purchase.purchaseNumber || '',
    date: new Date(purchase.createdAt).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }),
    status: purchase.status === 'RECEIVED' ? 'Received' : 
            purchase.status === 'ORDERED' ? 'Ordered' : 'Pending',
    total: `$${Number(purchase.total).toFixed(2)}`,
    paid: `$${Number(purchase.paidAmount).toFixed(2)}`,
    due: `$${Number(purchase.dueAmount).toFixed(2)}`,
    paymentStatus: purchase.paymentStatus === 'PAID' ? 'Paid' :
                   purchase.paymentStatus === 'PARTIAL' ? 'Partial' : 'Unpaid',
  };
};

export const transformEmployee = (employee: any) => {
  return {
    id: employee.id,
    img: 'user-01.jpg',
    ID: employee.employeeId || employee.id.substring(0, 8).toUpperCase(),
    Employee: `${employee.firstName} ${employee.lastName}`,
    Designation: employee.designation?.name || 'N/A',
    Email: employee.email || '',
    Phone: employee.phone || '',
    Shift: employee.shift?.name || 'Regular',
    Status: employee.isActive ? 'Active' : 'Inactive',
  };
};

export const transformQuotation = (quotation: any) => {
  return {
    id: quotation.id,
    Product_Name: quotation.items?.[0]?.product?.name || 'N/A',
    Product_image: 'product-01.jpg',
    Custmer_Name: quotation.customer?.name || 'Walk-in Customer',
    Custmer_Image: 'user-01.jpg',
    Status: quotation.status === 'SENT' ? 'Sent' :
            quotation.status === 'ACCEPTED' ? 'Ordered' :
            quotation.status === 'CONVERTED' ? 'Converted' :
            quotation.status === 'REJECTED' ? 'Rejected' : 'Draft',
    Total: `$${Number(quotation.total).toFixed(2)}`,
    Date: new Date(quotation.createdAt).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }),
  };
};

export const transformBrand = (brand: any) => {
  return {
    id: brand.id,
    brand: brand.name,
    logo: brand.logo || '/src/assets/img/brand/brand-01.png',
    createdon: new Date(brand.createdAt).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }),
    status: brand.isActive ? 'Active' : 'Inactive',
  };
};

export const transformProduct = (product: any) => {
  return {
    id: product.id,
    product: product.name,
    productImage: product.image || '/src/assets/img/products/product-01.jpg',
    sku: product.sku,
    category: product.category?.name || 'N/A',
    brand: product.brand?.name || 'N/A',
    price: `$${Number(product.price).toFixed(2)}`,
    unit: product.unit?.name || 'Pc',
    qty: product.currentStock || 0,
    createdby: 'System',
    img: '/src/assets/img/users/user-01.jpg',
  };
};

export const transformInvoice = (invoice: any) => {
  return {
    id: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    customer: invoice.customer?.name || 'Walk-in Customer',
    date: new Date(invoice.createdAt).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }),
    total: `$${Number(invoice.total).toFixed(2)}`,
    paid: `$${Number(invoice.paidAmount).toFixed(2)}`,
    due: `$${Number(invoice.dueAmount).toFixed(2)}`,
    status: invoice.status === 'PAID' ? 'Paid' :
            invoice.status === 'PARTIAL' ? 'Partial' :
            invoice.status === 'OVERDUE' ? 'Overdue' : 'Unpaid',
  };
};

export const transformSale = (sale: any) => {
  return {
    id: sale.id,
    invoiceNumber: sale.invoiceNumber || sale.id.substring(0, 8).toUpperCase(),
    customer: sale.customer?.name || 'Walk-in Customer',
    date: new Date(sale.createdAt).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }),
    total: `$${Number(sale.total).toFixed(2)}`,
    status: sale.status === 'COMPLETED' ? 'Completed' :
            sale.status === 'CANCELLED' ? 'Cancelled' : 'Pending',
    paymentStatus: sale.paymentStatus === 'PAID' ? 'Paid' :
                   sale.paymentStatus === 'PARTIAL' ? 'Partial' : 'Unpaid',
  };
};

export const transformDepartment = (department: any) => {
  return {
    id: department.id,
    department: department.name,
    description: department.description || '',
    employees: department._count?.employees || 0,
    status: department.isActive ? 'Active' : 'Inactive',
  };
};

export const transformAttendance = (attendance: any) => {
  return {
    id: attendance.id,
    employee: attendance.employee?.firstName + ' ' + attendance.employee?.lastName,
    employeeId: attendance.employee?.employeeId,
    date: new Date(attendance.date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }),
    clockIn: attendance.clockIn ? new Date(attendance.clockIn).toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    }) : 'N/A',
    clockOut: attendance.clockOut ? new Date(attendance.clockOut).toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    }) : 'N/A',
    workHours: attendance.workHours ? `${Number(attendance.workHours).toFixed(2)}h` : '0h',
    status: attendance.status === 'PRESENT' ? 'Present' :
            attendance.status === 'ABSENT' ? 'Absent' :
            attendance.status === 'LATE' ? 'Late' :
            attendance.status === 'ON_LEAVE' ? 'On Leave' : 'Half Day',
  };
};

export const transformLeave = (leave: any) => {
  return {
    id: leave.id,
    employee: leave.employee?.firstName + ' ' + leave.employee?.lastName,
    employeeId: leave.employee?.employeeId,
    leaveType: leave.leaveType?.name,
    startDate: new Date(leave.startDate).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }),
    endDate: new Date(leave.endDate).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }),
    days: leave.days,
    status: leave.status === 'APPROVED' ? 'Approved' :
            leave.status === 'REJECTED' ? 'Rejected' :
            leave.status === 'CANCELLED' ? 'Cancelled' : 'Pending',
    reason: leave.reason || '',
  };
};

export const transformPayroll = (payroll: any) => {
  return {
    id: payroll.id,
    employee: payroll.employee?.firstName + ' ' + payroll.employee?.lastName,
    employeeId: payroll.employee?.employeeId,
    month: payroll.month,
    year: payroll.year,
    basicSalary: `$${Number(payroll.basicSalary).toFixed(2)}`,
    overtime: `$${Number(payroll.overtime).toFixed(2)}`,
    bonus: `$${Number(payroll.bonus || 0).toFixed(2)}`,
    deductions: `$${Number(payroll.deductions || 0).toFixed(2)}`,
    netSalary: `$${Number(payroll.netSalary).toFixed(2)}`,
    status: payroll.status === 'PAID' ? 'Paid' :
            payroll.status === 'PROCESSED' ? 'Processed' : 'Draft',
  };
};

export const transformAccount = (account: any) => {
  return {
    id: account.id,
    code: account.code,
    name: account.name,
    type: account.type,
    subType: account.subType || '',
    balance: `$${Number(account.balance).toFixed(2)}`,
    status: account.isActive ? 'Active' : 'Inactive',
  };
};

export const transformExpense = (expense: any) => {
  return {
    id: expense.id,
    category: expense.category?.name || 'N/A',
    amount: `$${Number(expense.amount).toFixed(2)}`,
    date: new Date(expense.date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }),
    reference: expense.reference || '',
    description: expense.description || '',
    status: expense.status === 'APPROVED' ? 'Approved' :
            expense.status === 'REJECTED' ? 'Rejected' : 'Pending',
  };
};

export const transformIncome = (income: any) => {
  return {
    id: income.id,
    category: income.category?.name || 'N/A',
    amount: `$${Number(income.amount).toFixed(2)}`,
    date: new Date(income.date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }),
    reference: income.reference || '',
    description: income.description || '',
  };
};

export const transformPurchaseReturn = (purchaseReturn: any) => {
  const product = purchaseReturn.items?.[0]?.product;
  return {
    id: purchaseReturn.id,
    img: product?.image || '',
    date: new Date(purchaseReturn.createdAt).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }),
    supplier: purchaseReturn.supplier?.name || 'N/A',
    reference: purchaseReturn.returnNumber || '',
    status: purchaseReturn.status === 'COMPLETED' ? 'Received' : 'Pending',
    grandTotal: `$${Number(purchaseReturn.total).toFixed(2)}`,
    paid: `$${Number(purchaseReturn.total).toFixed(2)}`,
    due: '$0.00',
    paymentStatus: 'Paid',
  };
};

