import * as React from 'react';
import Animated from 'react-native-reanimated';
import { View } from 'react-native';

interface Props {
  component: React.ReactNode;
  activeIndex: number;
  index: number;
  itemRef: React.RefObject<any>;
  animatedActiveIndex: Animated.Value<number>;
  animatedHoverIndex: Animated.Value<number>;
  activeHoverIndex: number;
  activeItemHeight: number;
  placeholder?: React.ReactNode;
  isHoverReady: boolean;
}

const { block, Value, cond, eq, set, lessThan, greaterThan } = Animated;

class RowItem extends React.Component<Props> {
  isActive = new Value(0);
  spacerTopHeight = new Value<number>(0);
  spacerBottomHeight = new Value<number>(0);

  renderContent = () => {
    const {
      activeIndex,
      activeHoverIndex,
      component,
      index,
      activeItemHeight,
      placeholder,
      isHoverReady,
    } = this.props;

    if (activeIndex === -1 || !isHoverReady) {
      return component;
    }

    if (activeIndex === index && activeHoverIndex === index) {
      return <View style={{ height: activeItemHeight, width: '100%' }}>{placeholder}</View>;
    }

    if (activeIndex === index && activeHoverIndex !== index) {
      return null;
    }

    return (
      <Animated.View
        style={{
          paddingTop:
            activeHoverIndex < activeIndex &&
            activeIndex !== index &&
            activeHoverIndex === index
              ? activeItemHeight
              : 0,
          paddingBottom:
            activeHoverIndex > activeIndex &&
            activeIndex !== index &&
            activeHoverIndex === index
              ? activeItemHeight
              : 0,
        }}
      >
        {component}
      </Animated.View>
    );
  };

  render() {
    const {
      itemRef,
      animatedActiveIndex,
      index,
      animatedHoverIndex,
      activeItemHeight,
    } = this.props;

    return (
      <>
        <Animated.Code>
          {() =>
            block([
              cond(
                eq(animatedHoverIndex, index),
                set(this.isActive, 1),
                set(this.isActive, 0),
              ),
              cond(
                eq(this.isActive, 1),
                [
                  cond(
                    eq(animatedActiveIndex, index),
                    [
                      // is element is equal selected element
                      set(this.spacerTopHeight, activeItemHeight),
                      set(this.spacerBottomHeight, 0),
                    ],
                    [
                      cond(lessThan(animatedActiveIndex, index), [
                        set(this.spacerTopHeight, 0),
                        set(this.spacerBottomHeight, activeItemHeight),
                      ]),
                      cond(greaterThan(animatedActiveIndex, index), [
                        set(this.spacerBottomHeight, 0),
                        set(this.spacerTopHeight, activeItemHeight),
                      ]),
                    ],
                  ),
                ],
                [set(this.spacerBottomHeight, 0), set(this.spacerTopHeight, 0)],
              ),
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
          {/*<Animated.View*/}
          {/*  style={{*/}
          {/*    height: this.spacerTopHeight,*/}
          {/*  }}*/}
          {/*>*/}
          {/*  {placeholder}*/}
          {/*</Animated.View>*/}
          {this.renderContent()}
          {/*<Animated.View*/}
          {/*  style={{*/}
          {/*    height: this.spacerBottomHeight,*/}
          {/*  }}*/}
          {/*>*/}
          {/*  {placeholder}*/}
          {/*</Animated.View>*/}
        </Animated.View>
      </>
    );
  }
}

export default RowItem;
