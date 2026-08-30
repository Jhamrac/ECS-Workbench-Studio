# Security Spec & Hardened Test Suite

## 1. Data Invariants
- Users can only read and write their own profile document `/users/{userId}` where `userId == request.auth.uid`.
- Station programs `/users/{userId}/programs/{programId}` can only be accessed by the authentic owner `userId == request.auth.uid`.
- On document creation, `uid` and `userId` must strictly match `request.auth.uid`.
- All string inputs must satisfy strict size constraints (`maxLength`) to prevent resource exhaustion attacks.

## 2. The "Dirty Dozen" Test Payloads
1. **Unauthenticated Profile Read**: Attempt to read `/users/user123` with no auth context -> REJECTED.
2. **Cross-User Profile Read**: User A (`userA`) attempts to read `/users/userB` -> REJECTED.
3. **Ghost Field Injection on User Creation**: Creating profile with `{ uid: 'userA', email: 'a@a.com', createdAt: '...', updatedAt: '...', isAdmin: true }` -> REJECTED.
4. **Spoofed UID Creation**: User A (`userA`) creating `/users/userA` with `uid: 'userB'` -> REJECTED.
5. **Cross-User Program Creation**: User A (`userA`) creating `/users/userB/programs/p1` -> REJECTED.
6. **Program UID Mismatch**: User A (`userA`) creating `/users/userA/programs/p1` with `userId: 'userB'` -> REJECTED.
7. **Oversized Title Payload**: Creating program with 2000-char title -> REJECTED.
8. **Oversized Program Data Payload**: Creating program with 1MB data payload -> REJECTED.
9. **Unauthenticated Program Listing**: Querying `/users/userA/programs` without sign-in -> REJECTED.
10. **Cross-User Program Deletion**: User B attempting to delete `/users/userA/programs/p1` -> REJECTED.
11. **Updating Immutable UID**: Attempting to change `userId` or `uid` on existing document -> REJECTED.
12. **Malicious ID Injection**: Accessing program with invalid path variable containing special characters like `../` or junk strings -> REJECTED.
