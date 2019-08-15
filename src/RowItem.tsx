import * as React from 'react';
import Animated from 'react-native-reanimated';
import { LayoutChangeEvent, View } from 'react-native';

interface Props {
  component: React.ReactNode;
  activeIndex: number;
  index: number;
  itemRef: React.RefObject<any>;
  animatedActiveIndex: Animated.Value<number>;
  activeHoverIndex: Animated.Value<number>;
  activeItemHeight: Animated.Value<number>;
  placeholder?: React.ReactNode;
}

const {
  block,
  Value,
  cond,
  eq,
  set,
  lessThan,
  greaterThan,
} = Animated;

class RowItem extends React.Component<Props> {
  isActive = new Value(0);
  spacerTopHeight = new Value<number>(0);
  spacerBottomHeight = new Value<number>(0);

  render() {
    const {
      component,
      itemRef,
      animatedActiveIndex,
      index,
      activeIndex,
      activeHoverIndex,
      activeItemHeight,
      placeholder,
    } = this.props;

    return (
      <>
        <Animated.Code>
          {() =>
            block([
              cond(
                eq(activeHoverIndex, index),
                set(this.isActive, 1),
                set(this.isActive, 0)
              ),
              cond(
                eq(this.isActive, 1),
                [
                  cond(
                    eq(animatedActiveIndex, index),
                    [
                      // is element is equal selected element
                      set(this.spacerTopHeight, activeItemHeight),
                      set(this.spacerBottomHeight, 0)
                    ],
                    [
                      cond(lessThan(animatedActiveIndex, index), [
                        set(this.spacerTopHeight, 0),
                        set(this.spacerBottomHeight, activeItemHeight),
                      ]),
                      cond(greaterThan(animatedActiveIndex, index), [
                        set(this.spacerBottomHeight, 0),
                        set(this.spacerTopHeight, activeItemHeight),
                      ])
                    ]
                  )
                ],
                [
                  set(this.spacerBottomHeight, 0),
                  set(this.spacerTopHeight, 0),
                ]
              )
            ])
          }
        </Animated.Code>
        <Animated.View
          ref={itemRef}
          // @ts-ignore
          style={{
            position: 'relative',
            opacity: 1,
          }}
        >
          <Animated.View
            style={{
              height: this.spacerTopHeight
            }}
          >
            {placeholder}
          </Animated.View>
          {activeIndex !== index && <Animated.View>{component}</Animated.View>}
          <Animated.View
            style={{
              height: this.spacerBottomHeight
            }}
          >
            {placeholder}
          </Animated.View>
        </Animated.View>
      </>
    );
  }
}

export default RowItem;
