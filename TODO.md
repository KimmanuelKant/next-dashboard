# TODO.md

# TO-DO LIST

## 1. UI/UX Enhancements

### **a. Tooltips on Columns**
- **Description:** Implement tooltips that appear when hovering over column headers, describing what each column represents. For mobile compatibility, add an "info" button that, when clicked, displays an overlay with column descriptions.
- **Current Status:** Partially implemented in the column selector dropdown.

### **b. Resizable Columns**
- **Description:** Enable users to resize table columns by dragging their edges, allowing for a more customized view of data.
- **Current Status:** Pending implementation.

## 2. Feature Additions

### **a. Awards Page**
- **Description:** Create a page displaying various awards using Bootstrap cards. Include options to toggle between weekly and seasonal awards based on team performance.
- **Current Status:** Not Started.

### **b. User Authentication (Log In)**
- **Description:** Implement a user authentication system allowing users to create accounts and log in. Provide access to all user-owned leagues through a dropdown menu and enable saving of custom presets.
- **Current Status:** Not Started.

### **c. Chat Functionality**
- **Description:** Develop a league-specific chat feature visible to all league members. Restrict message sending to logged-in users to maintain security and relevance.
- **Current Status:** Not Started.

### **d. Welcome/Search Page**
- **Description:** Design a welcome page with a search function to find leagues or teams. Allow users to select from their leagues and prompt them to choose which league dashboard to view.
- **Current Status:** Not Started.

### **e. Controlled Logging System**
- **Description:** Implement a controlled logging mechanism to facilitate meaningful debugging without cluttering the console during normal operations.
- **Current Status:** In Progress / To Be Implemented.

## 3. New Columns

### **a. Team Stats**
1. **Team Sell Value**
   - **Description:** Display how much money the team would have if all players were sold.

### **b. Player Stats**
1. **League Captaincy**
   - **Description:** Show the number and percentage of teams in the league that have selected the player as their captain and vice-captain.
2. **League Points**
   - **Description:** Display the total points the player has scored for all teams in the league this season and in the last gameweek.

## 4. Known Issues

### **a. Maximum League Size Limitation**
- **Description:** Currently, the application fetches data for leagues up to 50 members. Investigate the API's pagination to determine how many additional pages can be fetched before performance becomes a significant issue.
- **Current Status:** Under Investigation.

## 5. Technical Improvements

### **a. Caching Implementation**
- **Description:** Introduce a caching layer to store API responses temporarily, reducing the number of API calls and improving application performance.
- **Current Status:** Planned.

### **b. Optimize API Calls**
- **Description:** Review and optimize existing API calls to ensure efficient data fetching and minimize latency.
- **Current Status:** Planned.


