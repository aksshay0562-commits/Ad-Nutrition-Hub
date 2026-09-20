# Security Specification: AD Nutrition Hub Israna

## 1. Data Invariants
1. **Catalog Integrity**: Only authenticated administrators (`isAdmin()`) can create, update, or delete products in `/products/{productId}`. Products are publicly readable by any store visitor.
2. **Product Validation**: All products must contain valid `name`, positive `price`, allowed `availability` ('In Stock' | 'Out of Stock'), and bounded description lengths.
3. **User Profile Ownership**: Users can only read and update their own document in `/users/{userId}` where `request.auth.uid == userId`. No user can grant themselves the `admin` role during create or update.
4. **Admin Protection**: Documents in `/admins/{adminId}` can only be read/written by verified administrators.
5. **Enquiry Privacy**: Customers can create enquiries with phone and message. Enquiries can only be read by the creator (`request.auth.uid == resource.data.userId`) or an administrator.
6. **Denial-of-Wallet & Injection Prevention**: Path IDs and string properties have strict maximum length and regex guards to prevent large payload injections and resource exhaustion.

## 2. The "Dirty Dozen" Payloads (Designed to Fail)
1. **Unauthenticated Product Creation**: An unauthenticated visitor attempts to POST a product into `/products/prod-hacked`.
2. **Customer Price Tampering**: A signed-in regular customer attempts to update `/products/prod-1` price to ₹1.
3. **Self-Elevating Admin Profile**: A regular user attempts to create `/users/{uid}` with `{ role: 'admin' }`.
4. **User Profile Snooping**: User B attempts to read `/users/user-A` private details.
5. **Admin List Injection**: Non-admin user attempts to create a document in `/admins/{myUid}`.
6. **Product Oversized Payload**: An attacker attempts to inject a 1MB payload string into `description` of `/products/prod-overflow`.
7. **Negative Product Price**: Attempt to set a product with `price: -500`.
8. **Invalid Product Availability**: Attempt to set `availability: 'Free For All'` instead of 'In Stock' | 'Out of Stock'.
9. **Cross-User Enquiry Read**: User B attempts to list/get enquiries submitted by User A.
10. **Enquiry Status Tampering by Customer**: Customer attempts to change enquiry status directly to 'closed' or modify customer phone.
11. **ID Injection Attack**: Attempt to create product with ID containing non-alphanumeric malicious tokens like `../../root`.
12. **Ghost Fields / Shadow Update**: Attempt to update a product with an unapproved hidden field like `{ isVerifiedStoreOwner: true }`.

## 3. Security Assertions Summary
- Catch-all default deny on all collections.
- `isAdmin()` helper looks up `/admins/$(request.auth.uid)` or verified owner email `malikakshay075@gmail.com`.
- Strict validation helpers `isValidProduct`, `isValidUserProfile`, `isValidEnquiry`.
