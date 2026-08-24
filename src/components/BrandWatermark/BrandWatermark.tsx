import { Image, StyleSheet } from 'react-native';

/**
 * Faint brand marks bled off the top-right and bottom-left corners of a
 * screen's background. Purely decorative — sits behind all content and
 * never intercepts touches.
 */
export function BrandWatermark() {
  return (
    <>
      <Image
        source={require('../../../assets/watermark.png')}
        style={[styles.image, styles.topRight]}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      />
      <Image
        source={require('../../../assets/watermark.png')}
        style={[styles.image, styles.bottomLeft]}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      />
    </>
  );
}

const styles = StyleSheet.create({
  image: {
    position: 'absolute',
    width: 340,
    height: 340,
    opacity: 0.05,
    pointerEvents: 'none',
  },
  topRight: {
    top: -70,
    right: -110,
  },
  bottomLeft: {
    bottom: -70,
    left: -110,
  },
});
