/**
 * Error-boundary strings live in their own tiny module because the error boundary is a client
 * component present on every page: importing the full dictionaries there would ship both
 * languages' copy to every visitor. en.ts / ar.ts re-use these objects, so locale checks still apply.
 */
export const errorStrings = {
  en: {
    eyebrow: 'Error',
    title: 'Something went wrong',
    text: 'We could not load this page. Please try again.',
    retry: 'Try Again',
    home: 'Go to the Homepage',
  },
  ar: {
    eyebrow: 'خطأ',
    title: 'حدث خطأ ما',
    text: 'تعذر تحميل هذه الصفحة. يرجى المحاولة مرة أخرى.',
    retry: 'حاول مرة أخرى',
    home: 'العودة إلى الصفحة الرئيسية',
  },
};
