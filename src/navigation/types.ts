// Shared route param types for the root stack, so screens and the
// notification-tap handler in RootNavigator all agree on what each
// screen expects.

export type RootStackParamList = {
  MainTabs: undefined;
  // A tapped notification carries either a quote or a personal note.
  KindWord: { quoteId?: string; noteId?: string };
};
