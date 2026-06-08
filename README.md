# Conditioning Guide

A progressive web app for tracking and logging cardiac reconditioning exercises and recovery with comprehensive progress visualization and evidence-based safety guidance.

## Features

### Daily Logging
- **Session Tracking**: Log each conditioning session with timestamp and duration
- **Exercise Types**: Record different exercise modes (walking, cycling, swimming, etc.)
- **Intensity Measurement**: Use the Borg Rating of Perceived Exertion (RPE) scale (0-10) to accurately document exercise intensity
- **Feeling Assessment**: Rate your overall condition and recovery on a 1-5 scale after each session
- **Notes**: Add contextual details about your session—how you felt, any concerns, observations

### Progress Visualization & Analytics
- **Visual Charts**: Interactive Chart.js-powered visualizations showing:
  - Sessions over time (frequency and consistency)
  - Intensity trends across your reconditioning journey
  - Borg scale progression to monitor perceived exertion changes
  - Feeling/wellness patterns over weeks
- **Day Strip Calendar**: Quick-glance view of your activity across weeks with color-coded indicators:
  - Programmed sessions (scheduled exercises)
  - Light activity days
  - Rest days
  - Empty/no-logging days
- **Streak Counter**: Visual display of your consecutive session days to encourage consistency
- **Weekly Narrative Summary**: Personalized insights about your progress, patterns, and accomplishments
- **Chronological Log**: Detailed history of all sessions organized by date for reference and reflection
- **Range Filters**: View analytics for different time periods (last week, month, all-time) to spot trends

### Exercise Guidance
- **Structured Stages**: Progressive conditioning protocol with clear objectives and recommendations for each stage
- **Evidence-Based**: Guidance grounded in cardiac rehabilitation research and best practices
- **Stage Progression**: Track where you are in your conditioning journey and what comes next
- **Detailed Protocols**: Specific exercise recommendations, duration, and intensity for each stage

### Safety & Wellness
- **Symptom Monitoring**: Log and track any symptoms or concerns during your recovery
- **Safety Reminders**: Gentle, amber-toned (never alarming) reminders and guidance about safe reconditioning
- **Urgent Safety Blocks**: Clear information about when to pause activity and contact your healthcare provider
- **No Reds, No Alarms**: Calm, supportive tone designed for a health companion, not a warning system
- **Recovery Tracking**: Monitor how you're feeling and spot patterns that matter

### User Experience
- **Mobile-First Design**: Optimized for poolside and on-the-go use with large tap targets (48px minimum)
- **Responsive Layout**: Bottom-tab navigation for thumb-friendly mobile use; adapts gracefully to tablets and desktops
- **Multiple Themes**:
  - Warm paper (original, slightly saturated)
  - Soft white (cool neutrals)
  - High contrast (for low-vision accessibility)
  - Dark mode (warm dark with cream ink)
- **Text Scaling**: Adjustable text sizes (normal, large, x-large) for accessibility
- **Installable**: Add to your home screen and use like a native app with iOS and Android support
- **Offline-First**: Core functionality works without internet; data syncs when connection returns
- **Local Data Storage**: Your private health data stays on your device—no cloud sync required

## Technology

Built with vanilla JavaScript, HTML, and CSS for maximum performance and minimal dependencies:
- **91.7%** HTML (structure and templates)
- **5.8%** JavaScript (logic and interactivity)
- **2.5%** Rich Text Format (documentation)

**Why vanilla?** No heavy frameworks means faster load times, better battery life on mobile, offline reliability, and simpler maintenance. The app is designed to be lightweight and focused—perfect for health tracking when connectivity is unreliable or you want to keep things simple.

## Getting Started

1. Open `index.html` in a modern web browser (works on desktop, tablet, mobile)
2. Start logging your conditioning sessions
3. Watch your progress unfold through charts and visualizations
4. On mobile: tap the iOS/Android "Add to Home Screen" option to install as an app

Your data is stored locally and persists between sessions. No account creation needed.

---

*Personal cardiac reconditioning guide and logging app designed for safe, evidence-based recovery tracking.*
