# Security Specification — Amrit Prasaran Cloud Backend

## Authentication & Roles
- **Bootstrap Super Admin (`superAdmin`)**: Authenticated Google account with verified email `amritprasaran@gmail.com` (`request.auth.token.email == 'amritprasaran@gmail.com' && request.auth.token.email_verified == true`). Can grant or revoke correspondent/editor access via `/editorInvites/{emailLower}` and `/admins/{uid}`.
- **Invited Editor / Admin (`isAdmin`)**: Any authenticated user whose verified Google email matches an active document in `/editorInvites/{request.auth.token.email.lower()}`, or whose UID exists in `/admins/{uid}` with `role == 'admin'`.
- **Signed-In Reader (`reader`)**: Any authenticated user (`request.auth != null`). Owns their private profile and saved bookmarks under `/users/{uid}/...`.
- **Public Reader**: Unauthenticated visitor reading published news, view counters, sponsor banners, categories, breaking headlines, videos, E-Paper editions, approved comments, site settings, and footer social links, or submitting tips, newsletter signups, contact inquiries, and registering push tokens.

## Collection Access Matrix
1. **`/news/{newsId}`**
   - `read`: Public when `resource.data.isPublished != false`, or `isAdmin()`.
   - `create`, `update`, `delete`: `isAdmin()` only, with strict field and size validation (including `author`, `photoCaption`, `updatedAt`, `scheduledAt`).
2. **`/articleViews/{newsId}`**
   - `read`: Public.
   - `create`: Public with strict schema validation (`count == 1`).
   - `update`: Public only to increment `count` by `+1`.
   - `delete`: `isAdmin()` only.
3. **`/newsTips/{tipId}`**, **`/inquiries/{inquiryId}`**, **`/subscribers/{subId}`**
   - `create`: Public with strict schema, email/size bounds (`newsTips` status `'pending'`, `inquiries` status `'new'`).
   - `read`, `delete`: Strictly `isAdmin()` only (prevents any public scraping of emails, phone numbers, or personal messages).
   - `update`: Strictly `isAdmin()` on `/newsTips` and `/inquiries` (status updates only); disallowed on `/subscribers`.
4. **`/pushTokens/{tokenId}`**
   - `create`, `update`: Public with strict schema bounds for device FCM / push subscription registration.
   - `read`, `delete`: Strictly `isAdmin()` only so push tokens are never exposed publicly.
5. **`/ads/{adId}`**
   - `read`: Public.
   - `create`, `update`, `delete`: Strictly `isAdmin()` only with bounded URL & compressed image limits.
6. **`/editorInvites/{emailLower}`**
   - `get`: `isBootstrapAdmin()` OR verified signed-in user reading only their own lowercase email document.
   - `list`, `create`, `update`, `delete`: `isBootstrapAdmin()` only.
7. **`/categories/{categoryId}`, `/breakingNews/{itemId}`, `/videos/{videoId}`, `/socialLinks/{linkId}`, `/siteConfig/general`**
   - `read`: Public.
   - `write`: `isAdmin()` only.
8. **`/newspapers/{paperId}` & `/newspapers/{paperId}/chunks/{chunkId}`**
   - `read`: Public.
   - `write`: `isAdmin()` only (< 900KB chunks).
9. **`/comments/{commentId}`**
   - `read`: Public when `resource.data.status != 'hidden'`, or `isAdmin()`.
   - `create`: Public with strict schema & UID check.
   - `update`, `delete`: `isAdmin()` only, or comment owner delete.
10. **`/users/{userId}/private/profile` & `/users/{userId}/bookmarks/{newsId}`**
    - `read`, `write`: Strictly `isOwner(userId)`.
11. **`/admins/{userId}` & `/adminActivity/{activityId}`**
    - `read`, `write`: Strictly `isAdmin()` / `isBootstrapAdmin()`.
