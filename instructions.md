# Project: FleetFlow Management System
## Requirements Document

### 1. Business Requirements (Functional)
The objective is to centralize fleet operations into a single source of truth for financial and operational health.

#### A. Fleet & Expense Tracking
* **Asset Profiles:** Every vehicle must have a unique ID (License plate/VIN).
* **Expense Categorization:** Ability to log costs (Tires, Insurance, Tolls, Repairs) specifically linked to a Truck ID.
* **Fuel Management:** Log date, liters, total cost, and odometer reading at the time of fill-up.
* **Consumption Analytics:** System must automatically calculate fuel efficiency. 
  > Formula: $$Efficiency = \frac{Total\ Distance}{Total\ Fuel\ Consumed}$$

#### B. Maintenance & Compliance
* **Service Logs:** Record what was done, when, and by whom.
* **Preventative Alerts:** System should flag when a truck is nearing its next service interval based on mileage or date.

#### C. Financials & Billing
* **Invoicing:** Generate professional PDF invoices for clients. 
* **Billing Logic:** Ability to bill based on flat rates, distance, or time.

#### D. Security & Access (RBAC)
* **Admin:** Full visibility, financial reporting, and user management.
* **Fleet Manager:** Maintenance scheduling, fuel logging, and expense entry.
* **Finance/Accounting:** Invoicing and payment tracking only.
* **Drivers:** (Optional) Mobile-friendly view to log fuel and mileage.

---

### 2. Technical Requirements (The "Stack")

#### A. Database Schema (Relational)
To track data "per truck," we require a relational database. 


* **Table: Vehicles** (ID, Make, Model, Year, Plate)
* **Table: Fuel_Logs** (ID, Vehicle_ID, Date, Liters, Cost, Odometer)
* **Table: Maintenance** (ID, Vehicle_ID, Date, Description, Cost)
* **Table: Invoices** (ID, Client_ID, Amount, Status, Issue_Date)

#### B. Recommended Technology Options
* **The No-Code Route (Best for non-coders):** * *Platform:* Bubble.io or FlutterFlow.
    * *Database:* Built-in.
    * *Why:* You can drag and drop the interface and manage the logic without writing syntax.
* **The Traditional Route (For hiring a developer):**
    * *Frontend:* React.js or Vue.js.
    * *Backend:* Node.js (Express) or Python (Django).
    * *Database:* PostgreSQL.

#### C. Core Features to Develop
* **Authentication:** Secure login using Email/Password with Role-Based Access Control.
* **Dashboard:** A visual summary showing "Total Spend vs. Total Revenue" and "Top 3 Most Expensive Trucks."
* **PDF Engine:** Integration (like PDFKit or Puppeteer) to generate and download invoices.

---

### 3. Success Metrics
1. **Real-time Cost per Mile:** Visible for every vehicle in the fleet.
2. **Zero Missed Services:** Automated alerts 500km before maintenance is due.
3. **Invoicing Speed:** Reduce time to generate an invoice to under 60 seconds.