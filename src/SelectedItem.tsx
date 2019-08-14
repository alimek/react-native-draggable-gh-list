import * as React from 'react';
import Animated, { Easing } from 'react-native-reanimated';
import { runTiming } from 'react-native-redash';
import { State } from 'react-native-gesture-handler';
import { Dimensions } from 'react-native';

const { height: wHeight } = Dimensions.get('window');

interface Props {
  component: React.ReactNode;
  translationY: Animated.Value<number>;
  activeItemHeight: Animated.Value<number>;
  absoluteY: Animated.Value<number>;
  scrollOffset: Animated.Value<number>;
  viewOffsetTop: Animated.Value<number>;
  gestureState: Animated.Value<number>;
  isAnimating: Animated.Value<number>;
  targetItemPositionY: Animated.Value<number>;
}

const {
  block,
  Value,
  cond,
  eq,
  neq,
  Clock,
  set,
  clockRunning,
  and,
  add,
  sub,
  debug,
} = Animated;

class SelectedItem extends React.Component<Props> {
  clock = new Clock();
  position = new Value<number>(0);
  top = new Value<number>(-wHeight);

  constructor(props: Props) {
    super(props);
    console.log('constructor');
  }

  render() {
    const {
      component,
      translationY,
      absoluteY,
      viewOffsetTop,
      gestureState,
      activeItemHeight,
      isAnimating,
      targetItemPositionY
    } = this.props;

    return (
      <>
        <Animated.Code>
          {() =>
            block([
              debug('position', this.position),
              cond(
                eq(isAnimating, -1),
                set(
                  this.top,
                  cond(
                    and(neq(absoluteY, -1), neq(viewOffsetTop, -1)),
                    sub(absoluteY, viewOffsetTop),
                    -wHeight
                  )
                )
              ),
              cond(eq(gestureState, State.END), [
                set(isAnimating, 1),
                set(
                  this.top,
                  runTiming(this.clock, add(this.top, translationY), {
                    toValue: sub(targetItemPositionY, activeItemHeight),
                    duration: 100,
                    easing: Easing.linear
                  })
                )
              ]),
              cond(eq(isAnimating, -1), [
                set(this.top, add(this.top, translationY))
              ]),
              cond(and(eq(isAnimating, 1), eq(clockRunning(this.clock), 0)), [
                set(isAnimating, 0),
                set(this.position, 0)
              ])
            ])
          }
        </Animated.Code>
        <Animated.View
          // @ts-ignore
          style={{
            position: 'absolute',
            top: this.top,
            left: 0,
            right: 0,
          }}
        >
          {component}
        </Animated.View>
      </>
    );
  }
}

export default SelectedItem;
