# Pluralsight User Automator UI Workflow

## Overview
The Pluralsight User Automator provides two main functionalities:
1. Bulk Add Users to Channel
2. Bulk Add Users to Role IQ

## Common Features

### Demo Mode
- Toggle switch in the top-right corner of each component
- When enabled:
  - Pre-fills demo data (Channel/Role IQ ID, API Key, Owner Email)
  - Uses sample @pluralsight.com email addresses
  - Simulates different user statuses (Ready, Error, Exists)

### Status Indicators
- **Ready** (Green)
  - Light green background with green text
  - Check icon
  - Indicates users ready to be added
  
- **Error** (Red)
  - Light red background with red text
  - X icon
  - Indicates users that cannot be added (e.g., not found in plan)
  
- **Exists** (Blue)
  - Light blue background with blue text
  - Check icon
  - Indicates users already in the channel/Role IQ

## Bulk Add to Channel Workflow

1. **Input Fields**
   - Channel ID
   - API Key (with link to get API key)
   - Owner Email ID
   - CSV File Upload

2. **File Upload**
   - Accepts .csv files
   - Template download available
   - Required format: Single column with header "email"

3. **Preview Process**
   - Click "Preview Users" to validate emails
   - Shows status for each user
   - Displays any errors or existing users

4. **Add Users**
   - Only "Ready" users are added
   - "Error" users are skipped
   - "Exists" users remain unchanged
   - Success message shows number of users added

## Bulk Add to Role IQ Workflow

1. **Input Fields**
   - Role IQ ID
   - API Key (with link to get API key)
   - Owner Email ID
   - CSV File Upload

2. **File Upload**
   - Accepts .csv files
   - Template download available
   - Required format: Single column with header "email"

3. **Preview Process**
   - Click "Preview Users" to validate emails
   - Shows status for each user
   - Displays any errors or existing users

4. **Add Users**
   - Only "Ready" users are added
   - "Error" users are skipped
   - "Exists" users remain unchanged
   - Success message shows number of users added

## Demo Mode Behavior

### Preview
- Shows a mix of statuses:
  - Ready: Users that can be added
  - Error: Users not found in plan
  - Exists: Users already in channel/Role IQ

### Add Users
- Only processes "Ready" users
- Updates their status to "Exists"
- Keeps "Error" and "Exists" users unchanged
- Shows success message with count of added users

## Error Handling

1. **Missing Information**
   - Validates required fields
   - Shows error toast for missing data

2. **File Processing**
   - Validates CSV format
   - Shows count of users found in file

3. **User Validation**
   - Checks if users exist in plan
   - Shows appropriate error messages

## UI Components

1. **Header**
   - Title
   - Description
   - Demo Mode toggle

2. **Form**
   - Input fields with labels
   - File upload with template download
   - Action buttons (Preview, Add Users, Clear Form)

3. **Preview Table**
   - User email
   - Status with color coding
   - Status message

4. **Notifications**
   - Success messages
   - Error messages
   - Processing indicators

## Best Practices

1. **File Preparation**
   - Use the provided template
   - Ensure emails are in correct format
   - Remove any empty rows

2. **API Key**
   - Keep API key secure
   - Use appropriate permissions
   - Get new key from developer portal if needed

3. **User Management**
   - Preview before adding
   - Check status messages
   - Verify success notifications 