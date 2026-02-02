
# Baby Log Analytics Dashboard

## Overview
A soft, baby-friendly analytics dashboard for tracking and visualizing baby feeding, sleep, and diaper patterns. The app will use mock data initially, with local storage for settings persistence.

---

## Core Features

### 1. Settings & Configuration Panel
- **Birth date input** - stored in local storage, used to calculate age in weeks
- **Night time range selector** - customizable (default 19:00-07:00), stored in local storage
- **Data endpoint input** - for future connection to real API

### 2. Date Range Selector
- Flexible date picker with start/end dates
- Quick presets: Last 7 days, Last 2 weeks, Last month, All data
- Persisted selection preference

---

## Main Visualizations

### 3. Daily Timeline Chart (Primary View)
- **Layout**: Days as columns, 24-hour time on vertical axis
- **Overlays** (toggleable):
  - Nap/sleep sessions as colored blocks
  - Feeding sessions as colored blocks
  - Wet diapers as marker icons
  - Dirty diapers as marker icons
- **Age display**: Shows "Week X" label next to each date based on birth date
- Night time zone visually highlighted

### 4. Weight Tracking Graph
- Line chart showing weight progression over time
- Age in weeks on x-axis
- Milestone markers or growth percentile reference lines

### 5. Diaper Changes Chart
- Bar chart or area chart showing wet vs dirty changes per day
- Stacked or side-by-side comparison

### 6. Sleep Analysis Dashboard
- **Day vs Night Sleep**: Comparative bar or donut chart
- **Average nap duration**: Trend line over time
- **Total sleep time**: Daily totals with trend

### 7. Additional Insights
- **Average wake window**: Time between naps throughout the day
- **Feeding frequency**: Number of sessions per day
- **Night wake-ups trend**: Track improvement over time

---

## Design Approach
- **Soft pastel color palette** - gentle pinks, blues, lavenders, mint
- **Rounded corners** and friendly typography
- **Card-based layout** for easy scanning
- **Responsive design** for desktop and tablet viewing
- **Clear legends** and tooltips for all charts

---

## Technical Approach
- Mock data generator for realistic baby log entries
- Recharts library (already installed) for visualizations
- Local storage for birth date and settings
- Configurable data fetching for future API integration
