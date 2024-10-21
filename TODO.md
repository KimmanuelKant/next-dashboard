# THINGS TO DO:

## UI/UX:
**1. Tooltips on column view dropdown items**
    ```bash
    When hoovering a column in the "show/hide"-dropdown, there should be a tooltip describing what the column shows. This needs to also work on mobile, so my first instinct is to add a little "info" button that is clickable, and will open a small overlay describing the different columns.
    ```

## Features


**1. Awards page** 
    ```
    Display a page full off bootstrap cards, showcasing various "awards", and maybe a toggle between weekly and seasonal
    ```

**2. User Log In**
    ```
    Implement a user database and allow users to log in, connecting the account with a user and giving you acces to all your minileagues.
    ```

**3. Chat**
    ```
    A league specific chat for each league. It should be visible for everyone, but you need to be logged in to send a message.
    ```

## NEW COLUMNS

**Team Stats**
1. Team Sell Value: How much money would the team be left with if they sold all players.
2. Fix points for BB-week column. Currently shows zero.

**Player Stats**
1. League Captaincy: show how many teams in the league has the played as their captain. (and vice captain). It can be broken down into percentage and a digit in two different columns.
2. League Points: How many points has the player scored for all teams in the league total this season, and last gameweek.

## Debugging

**1. Max League Size Limitation**

    Look into maximum league size of 50, as that is what we are currently fetching from the API. Our current code only fetches the first "page", but I need to look into how many more pages I can fetch before preformance becomes a real issue.