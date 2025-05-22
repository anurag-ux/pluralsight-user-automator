# Pluralsight User Automator Frontend Flow

## Component Interaction Flow

```mermaid
graph TD
    subgraph Pages["Pages"]
        Index[Index Page]
        Channel[Channel Page]
        RoleIQ[Role IQ Page]
    end

    subgraph Components["Components"]
        Header[Header Component]
        BulkChannel[BulkAddToChannel]
        BulkRoleIQ[BulkAddToRoleIQ]
        Toast[Toast Notifications]
        Table[Preview Table]
    end

    subgraph UI["UI Elements"]
        Form[Form Inputs]
        Buttons[Action Buttons]
        Status[Status Badges]
        FileUpload[File Upload]
    end

    %% Page Navigation
    Index -->|Navigate| Channel
    Index -->|Navigate| RoleIQ

    %% Component Composition
    Channel -->|Contains| BulkChannel
    RoleIQ -->|Contains| BulkRoleIQ
    BulkChannel -->|Uses| Header
    BulkRoleIQ -->|Uses| Header

    %% UI Element Integration
    BulkChannel -->|Contains| Form
    BulkChannel -->|Contains| Buttons
    BulkChannel -->|Contains| FileUpload
    BulkChannel -->|Shows| Table
    BulkChannel -->|Shows| Toast

    BulkRoleIQ -->|Contains| Form
    BulkRoleIQ -->|Contains| Buttons
    BulkRoleIQ -->|Contains| FileUpload
    BulkRoleIQ -->|Shows| Table
    BulkRoleIQ -->|Shows| Toast

    %% Status Flow
    Form -->|Updates| Status
    FileUpload -->|Updates| Status
    Buttons -->|Triggers| Status
```

## User Interaction Flow

```mermaid
sequenceDiagram
    participant User
    participant UI
    participant Form
    participant FileUpload
    participant Preview
    participant Status

    %% Initial Load
    User->>UI: Open Application
    UI->>UI: Load Components
    UI->>UI: Initialize Demo Mode

    %% Form Interaction
    User->>Form: Enter Channel/Role IQ ID
    User->>Form: Enter API Key
    User->>Form: Enter Owner Email

    %% File Upload
    User->>FileUpload: Upload CSV
    FileUpload->>UI: Parse CSV
    UI->>Preview: Show User Count

    %% Preview Process
    User->>Preview: Click Preview
    Preview->>Status: Show Mixed Statuses
    Status->>UI: Update Table

    %% Add Users
    User->>UI: Click Add Users
    UI->>Status: Update Ready Users
    Status->>UI: Show Success Message
```

## Status Management Flow

```mermaid
stateDiagram-v2
    [*] --> Initial
    Initial --> FormFilled: Enter Details
    FormFilled --> FileUploaded: Upload CSV
    FileUploaded --> Previewed: Click Preview
    
    Previewed --> Ready: Valid User
    Previewed --> Error: Invalid User
    Previewed --> Exists: Already Added
    
    Ready --> Added: Add Users
    Error --> Skipped: Skip
    Exists --> Skipped: Skip
    
    Added --> Complete
    Skipped --> Complete
    Complete --> [*]

    state Ready {
        [*] --> GreenBadge
        GreenBadge --> CheckIcon
    }
    
    state Error {
        [*] --> RedBadge
        RedBadge --> XIcon
    }
    
    state Exists {
        [*] --> BlueBadge
        BlueBadge --> CheckIcon
    }
```

## Component State Management

```mermaid
graph TD
    subgraph States["Component States"]
        DemoMode[Demo Mode State]
        FormState[Form State]
        FileState[File State]
        PreviewState[Preview State]
    end

    subgraph Actions["User Actions"]
        ToggleDemo[Toggle Demo Mode]
        UpdateForm[Update Form]
        UploadFile[Upload File]
        Preview[Preview Users]
        AddUsers[Add Users]
    end

    subgraph Updates["State Updates"]
        UpdateUI[Update UI]
        ShowToast[Show Toast]
        UpdateTable[Update Table]
    end

    %% State Management Flow
    ToggleDemo -->|Updates| DemoMode
    UpdateForm -->|Updates| FormState
    UploadFile -->|Updates| FileState
    Preview -->|Updates| PreviewState
    AddUsers -->|Updates| PreviewState

    %% UI Updates
    DemoMode -->|Triggers| UpdateUI
    FormState -->|Triggers| UpdateUI
    FileState -->|Triggers| UpdateUI
    PreviewState -->|Triggers| UpdateTable
    PreviewState -->|Triggers| ShowToast
```

## UI Element States

1. **Form Inputs**
   - Empty State
   - Filled State
   - Error State
   - Valid State

2. **File Upload**
   - No File
   - File Selected
   - Processing
   - Complete

3. **Status Badges**
   - Ready (Green)
   - Error (Red)
   - Exists (Blue)

4. **Action Buttons**
   - Disabled
   - Enabled
   - Loading
   - Complete

## Demo Mode States

1. **Initial State**
   - Empty form
   - No file
   - Disabled buttons

2. **Demo Enabled**
   - Pre-filled form
   - Demo file
   - Enabled buttons

3. **Preview State**
   - Mixed statuses
   - Color-coded badges
   - Status messages

4. **Complete State**
   - Updated statuses
   - Success message
   - Reset option 