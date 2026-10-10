// Draws the home screen widget whenever Android asks: when it's added, every
// few hours (updatePeriodMillis in app.json), when it's resized, and when
// its "Another" button is tapped. This can run with the app closed (as a
// "headless" task), so it reads everything it needs straight from storage
// instead of from React context. Android only — see index.ts.

import React from 'react';
import { Platform } from 'react-native';
import { requestWidgetUpdate, WidgetTaskHandlerProps } from 'react-native-android-widget';
import { KindWordWidget } from './KindWordWidget';
import { WORLDS } from '../data/worlds';
import { getQuoteById, getRandomQuote, loadQuotePrefs } from '../services/quotes';
import {
  getCircumstances,
  getQuoteLanguage,
  getUiLanguage,
  getWidgetQuoteId,
  getWorldId,
  setWidgetQuoteId,
} from '../services/storage';
import i18n from '../i18n';

// Must match the widget's "name" in app.json.
const WIDGET_NAME = 'KindWord';

// `keepQuote` redraws the quote already showing (after a resize, or a world
// change in the app) rather than picking a new one — as long as it's still
// in the chosen language and hasn't been marked "not for me" since.
async function renderKindWordWidget(keepQuote: boolean) {
  const [worldId, circumstances, quoteLanguage, uiLanguage, prefs, currentId] = await Promise.all([
    getWorldId(),
    getCircumstances(),
    getQuoteLanguage(),
    getUiLanguage(),
    loadQuotePrefs(),
    getWidgetQuoteId(),
  ]);

  const current = currentId ? getQuoteById(currentId) : undefined;
  const canKeep =
    keepQuote && current && current.language === quoteLanguage && !prefs.hiddenIds?.includes(current.id);
  const quote = canKeep
    ? current
    : getRandomQuote(circumstances, quoteLanguage, { ...prefs, avoidIds: currentId ? [currentId] : [] });
  await setWidgetQuoteId(quote.id);

  // The app's saved language override is normally applied when the app
  // starts (App.tsx), which may not have happened in a headless task.
  const t = i18n.getFixedT(uiLanguage);
  return (
    <KindWordWidget
      world={WORLDS[worldId]}
      text={quote.text}
      heading={t('home.heading')}
      anotherLabel={t('widget.another')}
    />
  );
}

export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  switch (props.widgetAction) {
    case 'WIDGET_ADDED':
    case 'WIDGET_UPDATE':
      props.renderWidget(await renderKindWordWidget(false));
      break;
    case 'WIDGET_RESIZED':
      props.renderWidget(await renderKindWordWidget(true));
      break;
    case 'WIDGET_CLICK':
      if (props.clickAction === 'NEXT_QUOTE') {
        props.renderWidget(await renderKindWordWidget(false));
      }
      break;
    default:
      break;
  }
}

// Redraws the widget, if one is on the home screen, after something it
// shows has changed in the app (the world, a language, a "not for me").
export async function refreshKindWordWidget(): Promise<void> {
  if (Platform.OS !== 'android') return;
  try {
    await requestWidgetUpdate({ widgetName: WIDGET_NAME, renderWidget: () => renderKindWordWidget(true) });
  } catch {
    // Non-fatal: the widget just keeps its current quote until its next update.
  }
}
