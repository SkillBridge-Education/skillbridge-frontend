export const CATEGORIES = [
  {
    key: 'all',
    labelKey: 'categories.all',
    skills: [],
  },
  {
    key: 'languages',
    labelKey: 'categories.languages',
    skills: ['French', 'English', 'Spanish', 'Arabic', 'Japanese', 'Chinese', 'Portuguese', 'Italian', 'German'],
  },
  {
    key: 'tech',
    labelKey: 'categories.tech',
    skills: ['Python', 'JavaScript', 'TypeScript', 'React', 'Node.js', 'Video editing', 'Photography', 'Data Analysis'],
  },
  {
    key: 'design',
    labelKey: 'categories.design',
    skills: ['Design', 'Figma', 'Illustration', 'Drawing', 'Painting', 'Graphic Design'],
  },
  {
    key: 'music',
    labelKey: 'categories.music',
    skills: ['Guitar', 'Piano', 'Drums', 'Singing', 'Music Theory', 'Violin', 'Bass'],
  },
  {
    key: 'science',
    labelKey: 'categories.science',
    skills: ['Mathematics', 'Physics', 'Chemistry', 'Philosophy', 'Biology', 'Statistics'],
  },
  {
    key: 'wellness',
    labelKey: 'categories.wellness',
    skills: ['Yoga', 'Cooking', 'Chess', 'Writing', 'Meditation', 'Running', 'Swimming'],
  },
  {
    key: 'business',
    labelKey: 'categories.business',
    skills: ['Business', 'Finance', 'Marketing', 'Entrepreneurship', 'Accounting', 'Sales'],
  },
]

export const SKILL_TO_CATEGORY = {}
CATEGORIES.forEach(cat => {
  cat.skills.forEach(skill => {
    SKILL_TO_CATEGORY[skill] = cat.key
  })
})