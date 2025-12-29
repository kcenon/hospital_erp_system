# Screen Design Guide

## Document Information

| Item | Content |
|------|---------|
| Document Version | 0.1.0.0 |
| Created Date | 2025-12-29 |
| Status | Draft |
| Owner | kcenon@naver.com |

---

## 1. Design Principles

### 1.1 Core Principles

| Principle | Description | Application |
|-----------|-------------|-------------|
| **Clarity** | Clear information delivery | Intuitive layout, clear labels |
| **Efficiency** | Complete tasks with minimal clicks | Shortcuts, quick input |
| **Consistency** | Same patterns and components | Design system compliance |
| **Accessibility** | Accessible to all users | WCAG 2.1 AA compliance |
| **Responsiveness** | Support various devices | PC, tablet, mobile optimization |

### 1.2 Special Considerations for Medical Environment

```
┌─────────────────────────────────────────────────────────────────┐
│                    Medical UI Special Requirements               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Quick Information Recognition                                   │
│     - Immediately recognize patient status by color              │
│     - Highlight critical values                                  │
│                                                                  │
│  Rapid Input                                                     │
│     - Quick vital sign entry                                     │
│     - Autocomplete, recent value suggestions                     │
│                                                                  │
│  Mobile Use                                                      │
│     - One-handed operation (tablet)                              │
│     - Large touch targets                                        │
│                                                                  │
│  Security Awareness                                              │
│     - Caution notice when displaying patient info                │
│     - Easy screen lock                                           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Design System

### 2.1 Color Palette

```
Primary Colors (Brand)
┌──────────────────────────────────────────────────────────────┐
│  Primary-500   │  #2563EB  │  Primary actions, links        │
│  Primary-600   │  #1D4ED8  │  Hover state                   │
│  Primary-700   │  #1E40AF  │  Active state                  │
└──────────────────────────────────────────────────────────────┘

Status Colors (Status Indicators)
┌──────────────────────────────────────────────────────────────┐
│  Success       │  #10B981  │  Normal, complete              │
│  Warning       │  #F59E0B  │  Caution, warning              │
│  Error         │  #EF4444  │  Error, danger                 │
│  Info          │  #3B82F6  │  Information                   │
└──────────────────────────────────────────────────────────────┘

Medical Status Colors (Medical Specific)
┌──────────────────────────────────────────────────────────────┐
│  Critical      │  #DC2626  │  Critical                      │
│  Serious       │  #F97316  │  Serious                       │
│  Moderate      │  #EAB308  │  Moderate                      │
│  Stable        │  #22C55E  │  Stable                        │
│  Discharged    │  #6B7280  │  Discharged                    │
└──────────────────────────────────────────────────────────────┘

Neutral Colors (Background, Text)
┌──────────────────────────────────────────────────────────────┐
│  Gray-50       │  #F9FAFB  │  Page background               │
│  Gray-100      │  #F3F4F6  │  Card background               │
│  Gray-200      │  #E5E7EB  │  Borders                       │
│  Gray-500      │  #6B7280  │  Secondary text                │
│  Gray-700      │  #374151  │  Body text                     │
│  Gray-900      │  #111827  │  Heading text                  │
└──────────────────────────────────────────────────────────────┘
```

### 2.2 Typography

```
Font Family
- Primary: 'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif
- Monospace: 'JetBrains Mono', monospace (code, numbers)

Font Sizes
┌───────────────────────────────────────────────────────────────┐
│  text-xs    │  12px / 16px  │  Captions, secondary info      │
│  text-sm    │  14px / 20px  │  Body secondary                │
│  text-base  │  16px / 24px  │  Body                          │
│  text-lg    │  18px / 28px  │  Subheading                    │
│  text-xl    │  20px / 28px  │  Section title                 │
│  text-2xl   │  24px / 32px  │  Page title                    │
│  text-3xl   │  30px / 36px  │  Dashboard figures             │
└───────────────────────────────────────────────────────────────┘

Font Weights
- Regular (400): Body
- Medium (500): Labels, emphasis
- Semibold (600): Subheadings
- Bold (700): Titles
```

### 2.3 Spacing System

```
Spacing Scale (Tailwind based)
┌───────────────────────────────────────────────────────────────┐
│  1   │   4px  │  Icon internal                               │
│  2   │   8px  │  Minimum spacing between elements            │
│  3   │  12px  │  Related element spacing                     │
│  4   │  16px  │  Component internal padding                  │
│  5   │  20px  │  Section spacing                             │
│  6   │  24px  │  Card padding                                │
│  8   │  32px  │  Inter-section spacing                       │
│  12  │  48px  │  Major section spacing                       │
└───────────────────────────────────────────────────────────────┘
```

### 2.4 Component Library

```
Base Components (shadcn/ui based)
├── Button
│   ├── Primary (main action)
│   ├── Secondary (secondary action)
│   ├── Outline (outlined)
│   ├── Ghost (no background)
│   └── Destructive (delete, danger)
│
├── Input
│   ├── Text Input
│   ├── Number Input (for vitals)
│   ├── Date Picker
│   ├── Time Picker
│   ├── Select
│   └── Textarea
│
├── Data Display
│   ├── Table (patient list)
│   ├── Card (info card)
│   ├── Badge (status display)
│   └── Avatar (user display)
│
├── Feedback
│   ├── Alert (notification)
│   ├── Toast (temporary notification)
│   ├── Dialog (modal)
│   └── Progress (progress status)
│
└── Navigation
    ├── Sidebar (main nav)
    ├── Tabs (tabs)
    ├── Breadcrumb (path)
    └── Pagination (paging)
```

---

## 3. Screen Structure

### 3.1 Overall Layout

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              Header (64px)                                   │
│  ┌──────────┐  ┌─────────────────────────────────┐  ┌─────────────────┐   │
│  │   Logo   │  │         Search                   │  │   User Menu     │   │
│  └──────────┘  └─────────────────────────────────┘  └─────────────────┘   │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌────────────┐                                                             │
│  │            │                                                             │
│  │  Sidebar   │                    Main Content                             │
│  │  (240px)   │                                                             │
│  │            │  ┌─────────────────────────────────────────────────────┐  │
│  │ - Dashboard│  │                                                     │  │
│  │ - Patients │  │                     Page Content                    │  │
│  │ - Rooms    │  │                                                     │  │
│  │ - Reports  │  │                                                     │  │
│  │ - Rounding │  │                                                     │  │
│  │ - Admin    │  │                                                     │  │
│  │            │  │                                                     │  │
│  │            │  └─────────────────────────────────────────────────────┘  │
│  │            │                                                             │
│  └────────────┘                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Responsive Breakpoints

| Breakpoint | Width | Layout | Target Device |
|------------|-------|--------|---------------|
| Mobile | < 640px | Single column, bottom tabs | Smartphone |
| Tablet | 640px - 1023px | 2 columns, collapsed sidebar | Tablet (rounds) |
| Desktop | 1024px - 1279px | Full layout | Laptop |
| Wide | >= 1280px | Extended layout | Large monitor |

---

## 4. Main Screen Designs

### 4.1 Login Screen

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│                        ┌─────────────────┐                      │
│                        │                 │                      │
│                        │      Logo       │                      │
│                        │                 │                      │
│                        └─────────────────┘                      │
│                                                                  │
│                   Inpatient Management System                    │
│                                                                  │
│                     ┌───────────────────────┐                   │
│                     │  User ID              │                   │
│                     └───────────────────────┘                   │
│                                                                  │
│                     ┌───────────────────────┐                   │
│                     │  Password             │                   │
│                     └───────────────────────┘                   │
│                                                                  │
│                     [ ] Keep me logged in                        │
│                                                                  │
│                     ┌───────────────────────┐                   │
│                     │       Login           │                   │
│                     └───────────────────────┘                   │
│                                                                  │
│                        Forgot Password ->                        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Dashboard

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Dashboard                                            2025-12-29 (Sun)      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐  ┌──────────┐ │
│  │  Inpatients    │  │  Today Admits  │  │ Today Discharge│  │  Empty   │ │
│  │      45        │  │      3         │  │      2         │  │  Beds: 8 │ │
│  │  +2 from yday  │  │                │  │                │  │          │ │
│  └────────────────┘  └────────────────┘  └────────────────┘  └──────────┘ │
│                                                                              │
│  ┌─────────────────────────────────────────┐  ┌────────────────────────┐   │
│  │      Room Status (3F Internal Medicine)  │  │    Today's Rounds      │   │
│  │  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐      │  │                        │   │
│  │  │ 301 │ │ 302 │ │ 303 │ │ 304 │      │  │  Morning Round @ Active │   │
│  │  │ **  │ │ *o  │ │ **  │ │ oo  │      │  │  - 12/15 patients done  │   │
│  │  └─────┘ └─────┘ └─────┘ └─────┘      │  │                        │   │
│  │  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐      │  │  Afternoon Round o Plan │   │
│  │  │ 305 │ │ 306 │ │ 307 │ │ 308 │      │  │  - Start at 14:00      │   │
│  │  │ **  │ │ *o  │ │ oo  │ │ **  │      │  │                        │   │
│  │  └─────┘ └─────┘ └─────┘ └─────┘      │  │  ┌──────────────────┐  │   │
│  │                                        │  │  │   Start Rounding │  │   │
│  │  * Occupied  o Empty  # Maintenance    │  │  └──────────────────┘  │   │
│  └─────────────────────────────────────────┘  └────────────────────────┘   │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    Patients Requiring Attention                      │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │ ! John Doe (301-A) - Temperature 38.5C recorded     10m ago │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │ ! Jane Smith (305-B) - Vitals not entered (4h elapsed) 1h ago│   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.3 Patient List

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Patient Management                                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐ │
│  │ Search patients...    │  │ All     v  │  │ 3F Ward  v │  │ + Admit    │ │
│  └──────────────────────┘  └────────────┘  └────────────┘  └────────────┘ │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ Patient No  │ Name      │ Age/Sex │ Room   │ Diagnosis    │Doctor│Status│   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │ P2025001   │ John Doe  │ 34/M    │ 301-A │ Pneumonia    │Dr.Lee│@Stable│   │
│  │ P2025002   │ Jane Smith│ 45/F    │ 301-B │ Gastroenteritis│Dr.Park│@Stable│   │
│  │ P2025003   │ Bob Jones │ 67/M    │ 302-A │ Heart Failure │Dr.Lee│! Caution│   │
│  │ P2025004   │ Mary Brown│ 28/F    │ 303-A │ Appendectomy  │Dr.Kim│@Stable│   │
│  │ P2025005   │ Tom Wilson│ 72/M    │ 305-B │ Stroke        │Dr.Lee│!Critical│   │
│  │                                                                      │   │
│  │  ... (scroll)                                                        │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  < 1  2  3  4  5 >                                  Total 45 / 20 per page v│
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.4 Patient Details

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  <- Patient List                                       John Doe (P2025001)  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │  ┌──────────┐                                                         │ │
│  │  │          │  John Doe                       ┌─────────┐            │ │
│  │  │  Photo   │  P2025001 | 34 M | A+ Type     │ @ Stable │            │ │
│  │  │          │  Internal Medicine 301 Bed A    └─────────┘            │ │
│  │  └──────────┘                                                         │ │
│  │                                                                        │ │
│  │  Admitted: 2025-12-25   Expected Discharge: 2026-01-05   Day 10       │ │
│  │  Attending: Dr. Lee     Primary Nurse: Nurse Kim                      │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Basic Info │ Vitals  │  I/O  │ Medications │ Nursing Notes │ Reports │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │                                                                      │   │
│  │  Latest Vital Signs (2025-12-29 08:00)            [+ New Vitals]    │   │
│  │  ┌─────────────────────────────────────────────────────────────┐    │   │
│  │  │                                                              │    │   │
│  │  │  Temp       BP           Pulse    Resp      SpO2            │    │   │
│  │  │  36.5C    120/80 mmHg    72 bpm   18 /min   98%             │    │   │
│  │  │                                                              │    │   │
│  │  └─────────────────────────────────────────────────────────────┘    │   │
│  │                                                                      │   │
│  │  Vital Trend Chart (Last 7 Days)                                    │   │
│  │  ┌─────────────────────────────────────────────────────────────┐    │   │
│  │  │     Temperature Chart                                       │    │   │
│  │  │     ────────────────────────────────────                    │    │   │
│  │  │  38C|                                                       │    │   │
│  │  │  37C|    .  .                                              │    │   │
│  │  │  36C|  .      .  .  .  .                                   │    │   │
│  │  │     └───┴───┴───┴───┴───┴───┴───                           │    │   │
│  │  │        23  24  25  26  27  28  29                           │    │   │
│  │  └─────────────────────────────────────────────────────────────┘    │   │
│  │                                                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.5 Room Status Dashboard

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Room Status                             Main Bldg | 3F Internal Medicine v │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────────────────┐  Beds: 30 | Used: 22 | Empty: 6 | Maint: 2│
│  │  By Room Type   │  By Status      │                                      │
│  │  Single: 5      │  @ Stable: 18  │       Occupancy: 73.3%               │
│  │  Double: 10     │  ! Caution: 3  │                                      │
│  │  Multi: 3       │  ! Critical: 1 │                                      │
│  └──────────────────────────────────┘                                       │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                              Room Layout                              │  │
│  │                                                                       │  │
│  │    ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐      │  │
│  │    │    301    │  │    302    │  │    303    │  │    304    │      │  │
│  │    │  ┌─┐ ┌─┐  │  │  ┌─┐ ┌─┐  │  │  ┌─┐ ┌─┐  │  │  ┌─┐ ┌─┐  │      │  │
│  │    │  │*│ │*│  │  │  │*│ │o│  │  │  │*│ │*│  │  │  │o│ │o│  │      │  │
│  │    │  └─┘ └─┘  │  │  └─┘ └─┘  │  │  └─┘ └─┘  │  │  └─┘ └─┘  │      │  │
│  │    │  John Doe │  │  Bob Jones│  │  Mary Brown│  │  Empty    │      │  │
│  │    │  Jane Smith│  │  Empty   │  │  Tom Green │  │           │      │  │
│  │    └───────────┘  └───────────┘  └───────────┘  └───────────┘      │  │
│  │                                                                       │  │
│  │    ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐      │  │
│  │    │    305    │  │    306    │  │    307    │  │    308    │      │  │
│  │    │  ┌─┐ ┌─┐  │  │  ┌─┐ ┌─┐  │  │  ┌─┐ ┌─┐  │  │  ┌─┐ ┌─┐  │      │  │
│  │    │  │*│ │!│  │  │  │*│ │o│  │  │  │#│ │#│  │  │  │*│ │*│  │      │  │
│  │    │  └─┘ └─┘  │  │  └─┘ └─┘  │  │  └─┘ └─┘  │  │  └─┘ └─┘  │      │  │
│  │    │  Chris Lee│  │  Anna Kim │  │  Maintenance│  │  Mike Park│      │  │
│  │    │  Tom Wilson│ │  Empty    │  │           │  │  Sue Choi │      │  │
│  │    └───────────┘  └───────────┘  └───────────┘  └───────────┘      │  │
│  │                                                                       │  │
│  │    * Stable    ! Caution    * Critical    o Empty    # Maintenance   │  │
│  │                                                                       │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.6 Vital Signs Entry (Tablet/Mobile)

```
┌─────────────────────────────────────────────────┐
│  <- Vital Entry                      John Doe   │
├─────────────────────────────────────────────────┤
│                                                  │
│  Measurement Time                                │
│  ┌─────────────────────────────────────────┐   │
│  │  2025-12-29  08:00                      │   │
│  └─────────────────────────────────────────┘   │
│                                                  │
│  ┌───────────────────┐  ┌───────────────────┐  │
│  │   Temperature (C)  │  │   BP (mmHg)       │  │
│  │  ┌─────────────┐  │  │ ┌─────┐ / ┌─────┐│  │
│  │  │   36.5      │  │  │ │ 120 │   │  80 ││  │
│  │  └─────────────┘  │  │ └─────┘   └─────┘│  │
│  │    Prev: 36.7     │  │  Prev: 118/78    │  │
│  └───────────────────┘  └───────────────────┘  │
│                                                  │
│  ┌───────────────────┐  ┌───────────────────┐  │
│  │    Pulse (bpm)    │  │   Resp (/min)     │  │
│  │  ┌─────────────┐  │  │  ┌─────────────┐  │  │
│  │  │     72      │  │  │  │     18      │  │  │
│  │  └─────────────┘  │  │  └─────────────┘  │  │
│  │    Prev: 74       │  │    Prev: 17       │  │
│  └───────────────────┘  └───────────────────┘  │
│                                                  │
│  ┌───────────────────┐  ┌───────────────────┐  │
│  │     SpO2 (%)      │  │   Glucose (mg/dL) │  │
│  │  ┌─────────────┐  │  │  ┌─────────────┐  │  │
│  │  │     98      │  │  │  │    100      │  │  │
│  │  └─────────────┘  │  │  └─────────────┘  │  │
│  └───────────────────┘  └───────────────────┘  │
│                                                  │
│  Notes                                           │
│  ┌─────────────────────────────────────────┐   │
│  │                                          │   │
│  │                                          │   │
│  └─────────────────────────────────────────┘   │
│                                                  │
│  ┌─────────────────────────────────────────┐   │
│  │              Save                        │   │
│  └─────────────────────────────────────────┘   │
│                                                  │
└─────────────────────────────────────────────────┘
```

---

## 5. Mobile/Tablet Optimization

### 5.1 Tablet Layout (For Rounds)

```
┌─────────────────────────────────────────────────────────────────┐
│  =  Rounding                                   Dr. Kim   [Gear] │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Morning Round | 2025-12-29                Progress: 12/15      │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  [x] 301-A John Doe (34/M)                       Done [check]│ │
│  │     Diagnosis: Pneumonia | Status: Stable                   │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  [ ] 301-B Jane Smith (45/F)                -> Current     │ │
│  │     Diagnosis: Gastroenteritis | Status: Stable            │ │
│  │  ┌─────────────────────────────────────────────────────┐ │ │
│  │  │  Latest Vitals (08:00)                              │ │ │
│  │  │  Temp: 36.8C | BP: 122/80 | Pulse: 76              │ │ │
│  │  └─────────────────────────────────────────────────────┘ │ │
│  │  ┌─────────────────────────────────────────────────────┐ │ │
│  │  │  Patient Status:  oStable  oImproving  oDeclining oEmergency│ │ │
│  │  │                                                      │ │ │
│  │  │  Observations:                                       │ │ │
│  │  │  ┌──────────────────────────────────────────────┐  │ │ │
│  │  │  │                                               │  │ │ │
│  │  │  └──────────────────────────────────────────────┘  │ │ │
│  │  │                                                      │ │ │
│  │  │  Orders:                                             │ │ │
│  │  │  ┌──────────────────────────────────────────────┐  │ │ │
│  │  │  │                                               │  │ │ │
│  │  │  └──────────────────────────────────────────────┘  │ │ │
│  │  │                                                      │ │ │
│  │  │  ┌────────────────┐  ┌────────────────────────┐   │ │ │
│  │  │  │     Skip       │  │   Save & Next Patient  │   │ │ │
│  │  │  └────────────────┘  └────────────────────────┘   │ │ │
│  │  └─────────────────────────────────────────────────────┘ │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  [ ] 302-A Bob Jones (67/M)                               │ │
│  │     Diagnosis: Heart Failure | Status: Caution            │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 Touch Interaction Guidelines

| Element | Minimum Size | Spacing | Notes |
|---------|-------------|---------|-------|
| Button | 44px x 44px | 8px | Apple HIG compliant |
| Input Field | 44px height | 8px | Include label |
| List Item | 56px height | 1px divider | Swipe actions supported |
| Tab | 48px height | - | Active tab highlighted |

---

## 6. Accessibility

### 6.1 WCAG 2.1 Compliance Items

| Item | Level | Implementation |
|------|-------|----------------|
| Color Contrast | AA | Text 4.5:1 minimum |
| Keyboard Access | AA | All functions accessible via keyboard |
| Focus Indicator | AA | Clear focus ring |
| Alt Text | A | Alt attribute on all images |
| Form Labels | A | Labels linked to all inputs |
| Error Identification | AA | Clear error messages |

### 6.2 Screen Reader Support

```html
<!-- Proper ARIA usage examples -->
<button
  aria-label="Enter Vitals"
  aria-describedby="vital-input-desc"
>
  + Vitals
</button>

<!-- Status notification -->
<div
  role="alert"
  aria-live="polite"
>
  Vital signs have been saved.
</div>

<!-- Patient status badge -->
<span
  class="status-badge status-critical"
  role="status"
  aria-label="Patient Status: Critical"
>
  Critical
</span>
```

---

## 7. Interaction Patterns

### 7.1 Loading State

```
┌─────────────────────────┐
│  Loading patient info    │
│                         │
│      @ Loading...       │
│                         │
└─────────────────────────┘
```

### 7.2 Error State

```
┌─────────────────────────────────┐
│  ! An error occurred             │
│                                 │
│  Unable to load patient info.   │
│  Please try again later.        │
│                                 │
│  ┌───────────────────────────┐ │
│  │        Retry              │ │
│  └───────────────────────────┘ │
└─────────────────────────────────┘
```

### 7.3 Empty State

```
┌─────────────────────────────────┐
│                                 │
│         [Clipboard]             │
│                                 │
│    No patients registered.      │
│                                 │
│  ┌───────────────────────────┐ │
│  │   + Register First Patient│ │
│  └───────────────────────────┘ │
└─────────────────────────────────┘
```

### 7.4 Confirmation Dialog

```
┌─────────────────────────────────┐
│  Confirm Discharge               │
├─────────────────────────────────┤
│                                 │
│  Discharge John Doe?            │
│                                 │
│  - Patient No: P2025001234      │
│  - Admission Date: 2025-12-25   │
│  - Discharge Date: 2025-12-29   │
│                                 │
│  ┌───────────┐  ┌────────────┐ │
│  │   Cancel  │  │  Discharge │ │
│  └───────────┘  └────────────┘ │
└─────────────────────────────────┘
```

---

## Appendix: Icon System

### Primary Icons (Using Lucide React)

| Icon | Usage | Code |
|------|-------|------|
| Hospital | Hospital/Admission | `<Building2 />` |
| Person | Patient/User | `<User />` |
| Bed | Room/Bed | `<Bed />` |
| Clipboard | Report/Log | `<ClipboardList />` |
| Syringe | Medication/Injection | `<Syringe />` |
| Heart | Vitals/Heartbeat | `<Heart />` |
| Gear | Settings | `<Settings />` |
| Bell | Notification | `<Bell />` |
| Plus | Add | `<Plus />` |
| Pencil | Edit | `<Pencil />` |
| Trash | Delete | `<Trash2 />` |
| Search | Search | `<Search />` |
