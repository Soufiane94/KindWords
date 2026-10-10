// The Android home screen widget (Phase 7): one gentle kind word, in the
// background colors and font of the user's world. Home screen widgets live
// outside the app, so this is built from react-native-android-widget's own
// primitives (FlexWidget, TextWidget) rather than regular React Native views.
// The fonts it can use are listed under that plugin in app.json.

import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';
import type { World } from '../data/worlds';

type Props = {
  world: World;
  text: string;
  heading: string;
  anotherLabel: string;
};

// The widget library types colors as "#..." strings; every palette color
// in worlds.ts already is one, this just tells TypeScript so.
function hex(color: string): `#${string}` {
  return color as `#${string}`;
}

export function KindWordWidget({ world, text, heading, anotherLabel }: Props) {
  const { colors, fonts, background } = world;
  const gradient = background
    ? {
        from: hex(background.colors[0]),
        to: hex(background.colors[background.colors.length - 1]),
        orientation: 'TOP_BOTTOM' as const,
      }
    : undefined;

  return (
    // Tapping the kind word opens the app; the small button at the bottom
    // swaps in another one without opening anything.
    <FlexWidget
      clickAction="OPEN_APP"
      accessibilityLabel={`${heading}: ${text}`}
      style={{
        height: 'match_parent',
        width: 'match_parent',
        flexDirection: 'column',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 14,
        borderRadius: 24,
        backgroundColor: hex(colors.background),
        ...(gradient ? { backgroundGradient: gradient } : {}),
      }}
    >
      <TextWidget text={heading} style={{ fontSize: 12, color: hex(colors.mutedText), fontFamily: fonts.body }} />
      <TextWidget
        text={text}
        maxLines={6}
        truncate="END"
        style={{
          fontSize: 17,
          color: hex(colors.primaryText),
          fontFamily: fonts.body,
          textAlign: 'center',
          adjustsFontSizeToFit: true,
        }}
      />
      <FlexWidget
        clickAction="NEXT_QUOTE"
        accessibilityLabel={anotherLabel}
        style={{ paddingHorizontal: 12, paddingVertical: 4 }}
      >
        <TextWidget
          text={`↻ ${anotherLabel}`}
          style={{ fontSize: 12, color: hex(colors.secondaryText), fontFamily: fonts.body }}
        />
      </FlexWidget>
    </FlexWidget>
  );
}
