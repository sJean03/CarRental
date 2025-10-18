# RentEase PH - Database Schema (Quick Review)

**Project:** Car Rental System (Student Project)  
**Date:** October 18, 2025  
**Status:** Pending Approval

---

## 🎯 What This System Does

**RentEase PH** is a car rental platform where:
- **Vehicle owners** lease their cars to RentEase and get paid monthly/percentage
- **Customers** book and rent vehicles instantly (no owner approval needed)
- **RentEase** manages everything (pricing, bookings, payments)

---

## 💰 Payment Methods (Phase 1)
- **Cash** - Pay at branch
- **GCash** - Direct transfer with screenshot verification

---

## 👥 User Roles

| Role | What They Can Do |
|------|------------------|
| **Customer** | Browse vehicles, book, pay, review |
| **Owner** | VIEW vehicle status, VIEW earnings (no booking control) |
| **Admin/Staff** | Manage everything, check-in/out, process payments |

---

## 📊 Database Tables (15 Total)

### **Core Tables**
1. **users** - All accounts (customers, owners, admin, staff)
2. **vehicle_owners** - Private owners who lease to RentEase
3. **vehicles** - Fleet inventory (RentEase-owned + leased)
4. **locations** - Branches (Manila, QC, Makati)
5. **vehicle_categories** - Small Car, Sedan, SUV, Van, Luxury

### **Booking & Rental**
6. **reservations** - Customer bookings
7. **rentals** - Active rental records (check-in/check-out data)
8. **payments** - Customer payments (Cash/GCash)
9. **insurance_plans** - Optional insurance packages

### **Owner Management**
10. **owner_payments** - Monthly payments to vehicle owners

### **Supporting**
11. **maintenance_records** - Service history
12. **vehicle_tracking** - GPS logs (optional)
13. **reviews** - Customer feedback
14. **addresses** - User addresses
15. **owner_access_logs** - Security tracking

---

## 🔄 How It Works

### **Owner Leasing Vehicle**
```
Owner registers → Admin adds vehicle → Owner gets paid monthly/percentage
```

### **Customer Booking**
```
Browse → Reserve → Pay → Pick up → Use → Return → Pay extras → Review
```

### **Owner Payment**
```
End of month → Calculate earnings → Deduct costs → Pay owner
```

---

## 💵 Owner Payment Options

| Type | How It Works |
|------|--------------|
| **Fixed Monthly** | Owner gets ₱15,000/month (example) |
| **Percentage Share** | Owner gets 60% of rental income (example) |

---

## ❓ Quick Questions for Approval

1. **Owner payment:** Fixed monthly OR percentage share?
2. **Deposits:** Required? What %?
3. **Late fees:** Hourly or daily rate?
4. **GPS tracking:** Enable in Phase 1?
5. **Branches:** Manila, QC, Makati correct?

---

## ✅ Approval

**Does this database structure fit your business needs?**

- [ ] **Approved** - Proceed with development

---

## 📋 Sample Data Included

The database comes with test data:
- 2 admin/staff users
- 3 branch locations
- 2 sample vehicle owners
- 3 sample vehicles
- 3 insurance plans

**Ready to test immediately after setup!**

---

## 🚀 Next Steps (After Approval)

1. ✅ Setup database in Docker
2. ✅ Build backend API
3. ✅ Build frontend
4. ✅ Test & deploy

---
