# Create Note of Interest for Internal Parking Space

## Flowchart

```mermaid
flowchart LR
A[Start] -->B(Get Parking Space)
B --> C{Is the Parking<br/>Space Internal?}
C --> |No| O
C --> |Yes| D[Get Contact]
D --> F{Is Contact<br/>a Tenant?}
F --> |No| O[End]
F --> |Yes| H{Is Contact in Waiting<br/>List for Parking Space?}
H --> |No| I[Add Contact<br/>to Waiting List]
I --> J[Create Listing]
J --> K[Create Application]
H --> |Yes| J
K --> O
```

## Sequence Diagram

```mermaid
sequenceDiagram
    #participant System as System
    actor User as User
    participant Core as Core
    participant Leasing as Leasing
    participant Property Mgmt as Property Management
    participant Communication as Communication
    participant OneCore DB as OneCore Database
    participant XPand DB as XPand SOAP Database
    participant XPand SOAP as XPand SOAP Service

    User ->> Core: Create Note Of Interest

    Core ->> Property Mgmt: Get Publ. Parking Space
    Property Mgmt ->> XPand SOAP: Get Publ. Parking Space
    XPand SOAP -->> Property Mgmt:Publ. Parking Space
    Property Mgmt -->> Core: Publ. Parking Space
    break when Parking Space is not internal/poängfri
        Core-->User: show error message
    end

    Core ->> Leasing: Get Contact
    Leasing ->> XPand DB: Get Contact
    XPand DB -->> Leasing:Contact
    Leasing -->> Core: Contact
    break when Contact is not a tenant
        Core-->User: show error message
    end

    alt Contact is not in Waiting List
        Core ->> Leasing: Add Contact to Waiting List
        Leasing ->> XPand SOAP: Add Contact to Waiting List
    end

    alt Listing has not been Added to OneCore
        Core ->> Leasing: Create Listing
        Leasing ->> OneCore DB: Create Listing
    end

    Core ->> Leasing: Create Applicant
    Leasing ->> OneCore DB: Create Applicant

    Core ->> User: Msg: Note of Interest Created
```
