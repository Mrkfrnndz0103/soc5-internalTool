# Outbound Internal Tool - Project Plan

## Overview
Enterprise-grade web application for managing outbound dispatch operations with role-based authentication, real-time notifications, and automated workflow integration with Seatalk and Gmail.

## 1. Authentication System

### 1.1 Login Flow
- **Initial Load**: Dashboard loads with 0.5-second delay before login modal appears
- **Role Selection**: Two authentication methods based on user role

### 1.2 FTE Authentication (Scan with Phone)
- **Method**: QR Code + Seatalk Mobile App
- **Flow**:
  1. User clicks "Scan with Phone"
  2. QR code generates and displays
  3. User scans QR with Seatalk mobile app
  4. Authentication validates against Supabase user table
  5. User account from Seatalk reflects in web app
- **Requirements**:
  - Seatalk SDK/API integration
  - QR code generation with unique session tokens
  - Real-time authentication status updates
  - User email validation against Supabase user table

### 1.3 Backroom Authentication (OTP Integration)
- **Roles**: Ops Coordinator, PIC, Admin, Data Team
- **Method**: Email OTP (One Time Pin)
- **Flow**:
  1. User clicks "Use Password"
  2. User enters organizational email
  3. Email validation (must be @shopeemobile-external.com)
  4. 6-digit OTP generated and sent to Gmail inbox
  5. User retrieves OTP from Gmail
  6. User enters OTP in web app
  7. Authentication completes
- **Requirements**:
  - Gmail API integration for OTP delivery
  - Email domain restriction (@shopeemobile-external.com)
  - OTP generation and validation system
  - Session management with role-based permissions

### 1.4 Success/Error Modals
- **Success Modal**: Animated popup with transitions and effects
- **Error Modals**: 
  - Wrong OTP entered
  - Unsuccessful QR scan
  - Invalid email domain
  - Network/server errors

## 2. Role-Based Access Control

### 2.1 Role Definitions
- **FTE**: Full-time employees with Seatalk access
- **Ops Coordinator**: Dispatch report creation and submission
- **PIC**: Dispatch report creation and submission  
- **Admin**: Full system access and user management
- **Data Team**: Report verification and approval workflow

### 2.2 Permission Matrix
| Feature | FTE | Ops Coord | PIC | Admin | Data Team |
|---------|-----|-----------|-----|-------|-----------|
| Dashboard | ✓ | ✓ | ✓ | ✓ | ✓ |
| Dispatch Report | ✓ | ✓ | ✓ | ✓ | ✗ |
| Prealert | ✗ | ✗ | ✗ | ✓ | ✓ |
| Outbound Dispatch | ✓ | ✓ | ✓ | ✓ | ✓ |
| User Management | ✗ | ✗ | ✗ | ✓ | ✗ |

## 3. Dispatch Workflow System

### 3.1 Dispatch Report Page
- **Users**: Ops Coordinator, PIC
- **Function**: Create and submit dispatch reports
- **Features**:
  - Editable table interface
  - Form validation
  - Draft auto-save
  - Submit button triggers workflow
- **On Submit**: 
  - Data moves to Prealert (Status: Pending)
  - Alarm sound notification for Data Team
  - Real-time status update

### 3.2 Prealert Page (Data Team Workspace)
- **Users**: Data Team, Admin
- **Function**: Verify and cross-check dispatch reports
- **Status Workflow**:

#### 3.2.1 Status Types
1. **Pending (Green)**: New submission, requires action
   - Alarm sound notification
   - Visual indicator for new reports
   
2. **Ongoing**: Currently being verified
   - Data Team working on verification
   - Status updated manually
   
3. **Verified**: Complete and accurate
   - Checkbox tick indicator
   - Triggers automated notifications
   - Moves to final processing
   
4. **Pending (Red)**: Inaccurate/incomplete
   - Red motif indicator
   - Requires correction from original submitter
   - Notification sent to Ops Coord/PIC

#### 3.2.2 Verification Actions
- **Cross-checking**: Data accuracy validation
- **Status updates**: Manual status progression
- **Rejection workflow**: Send back for corrections
- **Approval workflow**: Move to automated processing

### 3.3 Automated Processing (Verified Reports)
- **Seatalk Integration**:
  - Chatbot notifications to hub group chats
  - Multiple hub support with individual group chats
  - Generated Excel file attachment
- **Email Integration**:
  - Automated email to hub personnel
  - Excel file attachment
  - Customizable email templates
- **Data Source**: Google Sheets integration
  - Query and filter by LH Trip #
  - Real-time data synchronization
- **Final Status**: Auto "Done" status update

### 3.4 Outbound Dispatch Page
- **Users**: All roles (view access)
- **Function**: Historical dispatch data repository
- **Features**:
  - Same table structure as Dispatch Report
  - Advanced filtering:
    - Date range picker
    - Hub name filter
    - Status filter
    - LH Trip # search
  - Export functionality
  - Pagination for large datasets

## 4. Notification System

### 4.1 Audio Notifications
- **New Report Alarm**: Plays when dispatch report submitted
- **Error Alarm**: Plays for rejected reports
- **Alarm Management**: Stops when Data Team acknowledges

### 4.2 Visual Notifications
- **Screen Flash**: Red transparency overlay for rejected reports
- **Status Indicators**: Color-coded status badges
- **Real-time Updates**: Live status changes without refresh

### 4.3 External Notifications
- **Seatalk Messages**: Automated chatbot notifications
- **Email Alerts**: Automated email notifications
- **Mobile Push**: Through Seatalk mobile app

## 5. Integration Requirements

### 5.1 Seatalk Integration
- **Authentication**: QR code scanning with @seatalk/web-app-sdk
- **Chatbot**: Automated group chat notifications
- **User Management**: Sync user accounts
- **Mobile App**: Push notifications

### 5.2 Gmail Integration
- **OTP Delivery**: Automated email sending
- **Template System**: Customizable email templates
- **Attachment Support**: Excel file delivery
- **Domain Validation**: Email domain restrictions

### 5.3 Google Sheets Integration
- **Data Source**: Master data repository
- **Real-time Sync**: Live data updates
- **Query System**: Filter by LH Trip #
- **Export Generation**: Excel file creation

### 5.4 Supabase Database
- **User Management**: Role-based user storage
- **Session Management**: Authentication tokens
- **Data Storage**: Dispatch reports and status
- **Real-time Updates**: Live data synchronization

## 6. Technical Architecture

### 6.1 Frontend
- **Framework**: React 18 + TypeScript
- **UI Library**: Radix UI + Tailwind CSS
- **State Management**: React Context + Zustand
- **Real-time**: WebSocket connections
- **Audio**: Web Audio API for notifications

### 6.2 Backend
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth + Custom OTP
- **Real-time**: Supabase Realtime
- **File Storage**: Supabase Storage
- **API**: RESTful endpoints

### 6.3 External Services
- **Seatalk API**: Authentication and messaging (@seatalk/web-app-sdk)
- **Gmail API**: Email delivery and OTP
- **Google Sheets API**: Data synchronization
- **Excel Generation**: Server-side processing

## 7. Security Considerations

### 7.1 Authentication Security
- **OTP Expiration**: 5-minute validity
- **Session Management**: Secure token handling
- **Email Validation**: Domain restrictions
- **Rate Limiting**: Prevent brute force attacks

### 7.2 Data Security
- **Role-based Access**: Strict permission enforcement
- **Data Encryption**: At rest and in transit
- **Audit Logging**: User action tracking
- **Backup Strategy**: Regular data backups

## 8. Development Phases

### Phase 1: Authentication System (Week 1-2)
- Seatalk QR authentication
- Gmail OTP integration
- Role-based access control
- Success/error modals

### Phase 2: Core Workflow (Week 3-4)
- Dispatch Report page
- Prealert verification system
- Status management
- Basic notifications

### Phase 3: Automation (Week 5-6)
- Seatalk chatbot integration
- Email automation
- Google Sheets integration
- Excel generation

### Phase 4: Advanced Features (Week 7-8)
- Outbound Dispatch page
- Advanced filtering
- Audio notifications
- Performance optimization

### Phase 5: Testing & Deployment (Week 9-10)
- Integration testing
- User acceptance testing
- Production deployment
- Documentation

## 9. Suggestions and Improvements

### 9.1 User Experience Enhancements
- **Progressive Web App**: Offline capability and mobile optimization
- **Dark/Light Theme**: User preference settings
- **Keyboard Shortcuts**: Power user efficiency
- **Bulk Operations**: Multi-select actions for Data Team
- **Advanced Search**: Full-text search across all data

### 9.2 Performance Optimizations
- **Lazy Loading**: Component and data loading optimization
- **Caching Strategy**: Redis for frequently accessed data
- **CDN Integration**: Static asset delivery optimization
- **Database Indexing**: Query performance improvements
- **Real-time Optimization**: WebSocket connection pooling

### 9.3 Monitoring and Analytics
- **Error Tracking**: Sentry integration for error monitoring
- **Performance Monitoring**: Application performance insights
- **User Analytics**: Usage patterns and feature adoption
- **System Health**: Infrastructure monitoring dashboard
- **Audit Trail**: Comprehensive user action logging

### 9.4 Security Enhancements
- **Two-Factor Authentication**: Additional security layer
- **IP Whitelisting**: Network-level access control
- **Session Timeout**: Automatic logout for inactive users
- **Data Masking**: Sensitive information protection
- **Penetration Testing**: Regular security assessments

### 9.5 Integration Expansions
- **Microsoft Teams**: Alternative to Seatalk integration
- **Slack Integration**: Additional communication channel
- **WhatsApp Business**: Mobile notification alternative
- **SMS Gateway**: Backup notification method
- **Calendar Integration**: Schedule-based notifications

### 9.6 Advanced Features
- **Machine Learning**: Predictive analytics for dispatch patterns
- **Automated Validation**: AI-powered data accuracy checking
- **Voice Commands**: Hands-free operation capability
- **Mobile App**: Native mobile application
- **API Gateway**: Third-party integration support

### 9.7 Scalability Considerations
- **Microservices Architecture**: Service separation for scalability
- **Load Balancing**: High availability setup
- **Database Sharding**: Horizontal scaling strategy
- **Container Orchestration**: Kubernetes deployment
- **Auto-scaling**: Dynamic resource allocation

### 9.8 Business Intelligence
- **Dashboard Analytics**: Real-time KPI monitoring
- **Report Generation**: Automated business reports
- **Data Visualization**: Interactive charts and graphs
- **Export Options**: Multiple format support (PDF, CSV, Excel)
- **Scheduled Reports**: Automated report delivery

## 10. Success Metrics

### 10.1 Performance Metrics
- **Authentication Success Rate**: >99%
- **Page Load Time**: <2 seconds
- **System Uptime**: >99.9%
- **Error Rate**: <0.1%

### 10.2 User Adoption Metrics
- **Daily Active Users**: Target engagement levels
- **Feature Utilization**: Usage across all modules
- **User Satisfaction**: Feedback and ratings
- **Training Completion**: User onboarding success

### 10.3 Business Impact Metrics
- **Process Efficiency**: Time reduction in dispatch workflow
- **Error Reduction**: Decrease in manual errors
- **Cost Savings**: Operational cost improvements
- **Compliance**: Audit and regulatory adherence