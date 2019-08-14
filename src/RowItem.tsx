import * as React from 'react';
import Animated from 'react-native-reanimated';
import { runSpring } from 'react-native-redash';

interface Props {
  component: React.ReactNode;
  activeIndex: number;
  index: number;
  itemRef: React.RefObject<any>;
  translationY: Animated.Value<number>;
  animatedActiveIndex: Animated.Value<number>;
  scrollOffset: Animated.Value<number>;
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
  stopClock,
  add,
} = Animated;

class RowItem extends React.Component<Props> {
  clock = new Clock();
  zIndex = new Value<number>(1);
  position = new Value<number>(0);
  isActive = new Value<number>(0);
  isAnimating = new Value<number>(0);
  scale = new Value<number>(1);

  constructor(props: Props) {
    super(props);
  }

  render() {
    const {
      component,
      translationY,
      itemRef,
      animatedActiveIndex,
      index,
      scrollOffset
    } = this.props;

    return (
      <>
        {/*<Animated.Code>*/}
        {/*  {() =>*/}
        {/*    block([*/}
        {/*      cond(*/}
        {/*        and(*/}
        {/*          neq(animatedActiveIndex, -1),*/}
        {/*          eq(animatedActiveIndex, index)*/}
        {/*        ),*/}
        {/*        [*/}
        {/*          set(this.isActive, 1),*/}
        {/*          stopClock(this.clock),*/}
        {/*          set(this.isAnimating, 0)*/}
        {/*        ],*/}
        {/*        set(this.isActive, 0)*/}
        {/*      ),*/}
        {/*      cond(*/}
        {/*        eq(this.isActive, 1),*/}
        {/*        [*/}
        {/*          set(this.zIndex, 2),*/}
        {/*          set(this.position, add(scrollOffset, translationY))*/}
        {/*        ],*/}
        {/*        [*/}
        {/*          set(this.isAnimating, 1),*/}
        {/*          set(*/}
        {/*            this.position,*/}
        {/*            runSpring(this.clock, this.position, 0, {*/}
        {/*              toValue: new Value(0),*/}
        {/*              damping: 30,*/}
        {/*              mass: 1,*/}
        {/*              stiffness: 500.6,*/}
        {/*              overshootClamping: false,*/}
        {/*              restSpeedThreshold: 0.001,*/}
        {/*              restDisplacementThreshold: 0.001*/}
        {/*            })*/}
        {/*          )*/}
        {/*        ]*/}
        {/*      ),*/}
        {/*      cond(*/}
        {/*        and(eq(this.isAnimating, 1), eq(clockRunning(this.clock), 0)),*/}
        {/*        [*/}
        {/*          set(this.zIndex, 1),*/}
        {/*          set(this.isAnimating, 0),*/}
        {/*          set(this.position, 0),*/}
        {/*          set(this.isActive, 0)*/}
        {/*        ]*/}
        {/*      )*/}
        {/*    ])*/}
        {/*  }*/}
        {/*</Animated.Code>*/}
        <Animated.View
          ref={itemRef}
          // @ts-ignore
          style={{
            transform: [
              {
                translateY: this.position
              },
              {
                scale: this.scale
              }
            ],
            zIndex: this.zIndex
          }}
        >
          {component}
        </Animated.View>
      </>
    );
  }
}

export default RowItem;
