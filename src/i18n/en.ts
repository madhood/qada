export const en = {
  'app.title': 'Qada',
  'salah.heading': 'Salah Make-Up',
  'fast.heading': 'Fast Make-Up',

  'prayer.fajr': 'Fajr',
  'prayer.dhuhr': 'Dhuhr',
  'prayer.asr': 'Asr',
  'prayer.maghrib': 'Maghrib',
  'prayer.isha': 'Isha',

  'ymd.zero': '0 days',

  'unit.year.one': '{n} year',
  'unit.year.other': '{n} years',
  'unit.month.one': '{n} month',
  'unit.month.other': '{n} months',
  'unit.day.one': '{n} day',
  'unit.day.other': '{n} days',

  'action.increment': 'Add one to {label}',
  'action.decrement': 'Remove one from {label}',

  'confirm.title': 'Are you sure?',
  'confirm.body': 'No problem — remove one from {label}?',
  'confirm.yes': 'Yes, remove one',
  'confirm.cancel': 'Cancel',

  'praise.1': 'Alhamdulillah! Keep going.',
  'praise.2': 'MashaAllah, well done!',
  'praise.3': 'Every make-up counts. Keep it up!',
  'praise.4': 'Beautiful effort — may Allah accept it.',
  'praise.5': "That's one more off the list!",

  // Debt & Progress (Spec 002)
  'nav.debt': 'Debt & progress',
  'nav.home': 'Back to counters',

  'debt.heading': 'Your make-up debt',
  'debt.prayer.label': 'Missed prayers (days)',
  'debt.fast.label': 'Missed fasts (days)',
  'debt.save': 'Save',
  'debt.saved': 'Saved',

  'debt.estimator.heading': 'Estimate from dates',
  'debt.estimator.start': 'From',
  'debt.estimator.end': 'Until',
  'debt.estimator.compute': 'Calculate days',
  'debt.estimator.proposal': "That's {days} days — use this?",
  'debt.estimator.accept': 'Use it',

  'debt.error.empty': 'Please enter a number.',
  'debt.error.not-a-number': 'Please enter a whole number of days.',
  'debt.error.negative': "Days can't be negative.",
  'debt.error.not-integer': 'Please enter whole days only.',
  'debt.error.end-before-start': 'The end date is before the start date.',
  'debt.error.future-date': 'That date is in the future.',

  'progress.heading': 'Your progress',
  'progress.prayer.heading': 'Prayers',
  'progress.fast.heading': 'Fasts',
  'progress.completed': '{days} done',
  'progress.remaining': '{days} to go',
  'progress.percent': '{n}% complete',
  'progress.empty': "Set your debt to see how far you've come.",
  'progress.nothingOwed': 'Nothing to make up here — may Allah accept.',
  'progress.fullyMet': "You've completed this, alhamdulillah.",

  // Local Persistence (Spec 003)
  'storage.unavailable.title': 'Progress may not be saved',
  'storage.unavailable.body':
    'This device is blocking storage, so your changes might not be kept after you close the app. Your counts still work for now.',
} as const
