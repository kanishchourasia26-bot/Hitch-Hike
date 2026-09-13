# How to Add the Adventure Image

## Steps:

1. **Save the adventure image:**
   - Save the image you provided as `adventure.png` 
   - Place it in: `hitchhike-frontend/public/adventure.png`
   OR
   - Place it in: `hitchhike-frontend/src/assets/adventure.png`

2. **Update the Home.jsx file:**

### Option A: If you saved in `/public` folder
Find line ~167 in `Home.jsx` where it says:
```jsx
src="/api/placeholder/600/600"
```

Replace with:
```jsx
src="/adventure.png"
```

### Option B: If you saved in `/src/assets` folder
At the top of `Home.jsx`, add:
```jsx
import AdventureImg from '../assets/adventure.png';
```

Then replace line ~167:
```jsx
src={AdventureImg}
```

## What Changed:

✅ Background changed to WHITE  
✅ Text colors updated (gray-900 for headings)  
✅ Outline text for "NOT THE VIBE" in light gray  
✅ Feature pills now have orange backgrounds  
✅ Right side card ready for your adventure image  
✅ Stats overlayed at bottom of image card  
✅ All shadows and borders updated for light theme  
✅ Feature cards at bottom now white with orange borders  

The design now perfectly matches a light theme with your adventure illustration!
