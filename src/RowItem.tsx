import * as React from 'react';
import Animated from 'react-native-reanimated';

interface Props {
  component: React.ReactNode;
  activeIndex: number;
  index: number;
  itemRef: React.RefObject<any>;
  animatedActiveIndex: Animated.Value<number>;
  activeHoverIndex: Animated.Value<number>;
  activeItemHeight: Animated.Value<number>;
}

const {
  block,
  Value,
  cond,
  eq,
  set,
  lessThan,
  greaterThan
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
      activeItemHeight
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
                  // do something when hover is on element
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
                        set(this.spacerBottomHeight, activeItemHeight)
                      ]),
                      cond(greaterThan(animatedActiveIndex, index), [
                        set(this.spacerBottomHeight, 0),
                        set(this.spacerTopHeight, activeItemHeight)
                      ])
                    ]
                  )
                ],
                [set(this.spacerBottomHeight, 0), set(this.spacerTopHeight, 0)]
              )
            ])
          }
        </Animated.Code>
        <Animated.View
          style={{
            height: this.spacerTopHeight,
            backgroundColor: 'red'
          }}
        />
        <Animated.View
          ref={itemRef}
          // @ts-ignore
          style={{
            opacity: 1,
            height: activeIndex === index ? 0 : null
          }}
        >
          {component}
        </Animated.View>
        <Animated.View
          style={{
            height: this.spacerBottomHeight,
            backgroundColor: 'grey'
          }}
        />
      </>
    );
  }
}

export default RowItem;
