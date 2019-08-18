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
  viewOffsetTop: Animated.Value<number>;
  gestureState: Animated.Value<number>;
  isAnimating: Animated.Value<number>;
  targetItemPositionY: Animated.Value<number>;
  activeIndex: Animated.Value<number>;
  activeHoverIndex: Animated.Value<number>;
  setHoverComponentReady: () => void;
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
  greaterThan,
  lessOrEq
} = Animated;

class SelectedItem extends React.PureComponent<Props> {
  clock = new Clock();
  top = new Value<number>(-wHeight);

  componentDidMount(): void {
    setTimeout(this.props.setHoverComponentReady, 200);
  }

  render() {
    const {
      component,
      translationY,
      absoluteY,
      viewOffsetTop,
      gestureState,
      isAnimating,
      targetItemPositionY,
      activeIndex,
      activeHoverIndex
    } = this.props;

    return (
      <>
        <Animated.Code>
          {() =>
            block([
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
                    toValue: sub(
                      cond(
                        greaterThan(activeHoverIndex, activeIndex),
                        targetItemPositionY,
                        cond(
                          lessOrEq(activeHoverIndex, activeIndex),
                          targetItemPositionY
                        )
                      ),
                      viewOffsetTop
                    ),
                    duration: 100,
                    easing: Easing.linear
                  })
                )
              ]),
              cond(and(neq(absoluteY, -1), eq(isAnimating, -1)), [
                set(this.top, add(this.top, translationY))
              ]),
              cond(and(eq(isAnimating, 1), eq(clockRunning(this.clock), 0)), [
                set(isAnimating, 0)
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
            right: 0
          }}
        >
          {component}
        </Animated.View>
      </>
    );
  }
}

export default SelectedItem;
