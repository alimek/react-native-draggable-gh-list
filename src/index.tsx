import * as React from 'react';
import {
  PanGestureHandler,
  ScrollView,
  State as GHState
} from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';
import { Dimensions, View } from 'react-native';

import RowItem from './RowItem';

const { height: wHeight } = Dimensions.get('window');

interface OnMoveEnd {
  data: any[];
}

interface Props {
  data: any[];
  onMoveEnd: ({ data }: OnMoveEnd) => void;
  renderItem: ({ item, index, startDrag }) => React.ReactNode;
  extractKey: (item: any) => string;
}

interface State {
  activeIndex: number;
}

enum ScrollDirection {
  DOWN,
  UP
}

const {
  cond,
  Clock,
  eq,
  set,
  round,
  divide,
  add,
  Value,
  lessOrEq,
  multiply,
  and,
  call,
  neq,
  greaterThan,
  sub,
  greaterOrEq,
  debug,
  clockRunning,
  stopClock,
  startClock,
  block
} = Animated;

class DraggableScrollView extends React.Component<Props, State> {
  scrolling = new Clock();

  itemRefs: React.RefObject<any>[];
  containerRef: React.RefObject<View> = React.createRef();
  scrollRef: React.RefObject<ScrollView> = React.createRef();

  gestureStartPoint = new Value<number>(0);
  gestureState = new Value<number>(0);

  itemTransitions: Animated.Value<number>[];
  activeItemAbsoluteY = new Value<number>(-1);
  activeItemHeight = new Value<number>(0);
  activeHoverIndex = new Value<number>(-1);
  absoluteTranslationY = new Value<number>(0);
  translationY = new Value<number>(0);
  activeIndex = new Value<number>(-1);
  viewOffsetTop = new Value<number>(0);
  viewOffsetBottom = new Value<number>(0);
  scrollOffset = new Value<number>(0);
  scrolledOffset = new Value<number>(0);
  animatedIsScrolling = new Value<number>(0);

  isScrolling = false;

  onGestureEvent = Animated.event(
    [
      {
        nativeEvent: {
          translationY: this.translationY,
          absoluteY: this.absoluteTranslationY,
          state: this.gestureState
        }
      }
    ],
    {
      useNativeDriver: true
    }
  );

  constructor(props: Props) {
    super(props);

    this.itemRefs = props.data.map(() => React.createRef());
    this.itemTransitions = props.data.map(() => new Animated.Value<number>(0));

    this.state = {
      activeIndex: -1
    };
  }

  // _handlePanResponderGrant = (
  //   e: GestureResponderEvent,
  //   gestureState: PanResponderGestureState
  // ) => {
  //   this.gestureStartPoint.setValue(gestureState.y0);
  // };
  //
  // _handlePanResponderMove = (
  //   e: GestureResponderEvent,
  //   gestureState: PanResponderGestureState
  // ) => {
  //   this.absoluteTranslationY.setValue(gestureState.moveY);
  //   this.translationY.setValue(gestureState.dy);
  // };

  _handlePanResponderEnd = () => {
    this.setState({
      activeIndex: -1
    });
    this.activeIndex.setValue(-1);
    this.activeHoverIndex.setValue(-1);
    this.activeItemHeight.setValue(0);
    this.gestureStartPoint.setValue(0);
    this.activeItemAbsoluteY.setValue(-1);
    this.translationY.setValue(0);
    this.absoluteTranslationY.setValue(0);
    this.scrolledOffset.setValue(0);
  };

  startDrag = (item: any, index: number) => {
    this.onRowBecomeActive(index);
    this.activeIndex.setValue(index);
    this.activeHoverIndex.setValue(index);
    this.setState({
      activeIndex: index
    });
  };

  onRowBecomeActive = (index: number) => {
    this.containerRef.current &&
      this.containerRef.current
        // @ts-ignore
        .getNode()
        .measureInWindow((x, y, width, height) => {
          this.viewOffsetTop.setValue(y);
          this.viewOffsetBottom.setValue(wHeight - y - height);
        });

    this.itemRefs[index] &&
      this.itemRefs[index].current &&
      this.itemRefs[index].current
        // @ts-ignore
        .getNode()
        .measureInWindow((x, y, width, height) => {
          if (height !== undefined) {
            this.activeItemAbsoluteY.setValue(y);
            this.activeItemHeight.setValue(height);
          }
        });
  };

  renderItem = ({ item, index }) => {
    const { renderItem, extractKey } = this.props;
    const { activeIndex } = this.state;
    const component = renderItem({
      item,
      index,
      startDrag: () => this.startDrag(item, index)
    });

    return (
      <RowItem
        component={component}
        key={extractKey(item)}
        activeIndex={activeIndex}
        animatedActiveIndex={this.activeIndex}
        index={index}
        itemRef={this.itemRefs[index]}
        translationY={this.translationY}
        scrollOffset={this.scrolledOffset}
      />
    );
  };

  scrollUp = (values: number[]) => {
    const [offset] = values;

    if (offset > 0) {
      this.scroll(ScrollDirection.UP, values);
    }
  };
  scrollDown = (values: number[]) => this.scroll(ScrollDirection.DOWN, values);

  scroll = (direction: ScrollDirection, values: number[]) => {
    const [currentOffset, itemHeight] = values;

    if (this.isScrolling) {
      return;
    }

    console.log('performing scroll');

    this.isScrolling = true;
    this.animatedIsScrolling.setValue(1);
    let offset = currentOffset;

    if (direction === ScrollDirection.UP) {
      offset -= itemHeight;
      this.scrolledOffset.setValue(
        offset < 0 ? 0 : sub(this.scrolledOffset, itemHeight)
      );
    } else {
      offset += itemHeight;
      this.scrolledOffset.setValue(add(this.scrolledOffset, itemHeight));
    }

    if (offset < 0) {
      offset = 0;
    }

    this.scrollRef.current &&
      // @ts-ignore
      this.scrollRef.current.scrollTo({
        animated: true,
        y: offset
      });

    setTimeout(() => {
      this.isScrolling = false;
      this.animatedIsScrolling.setValue(0);
    }, 500);
  };

  onScrollEvent = event => {
    this.scrollOffset.setValue(event.nativeEvent.contentOffset.y);
  };

  onDrop = () => {
    this.setState({
      activeIndex: -1
    });
    this.translationY.setValue(0);
    this.gestureState.setValue(0);
  };

  render() {
    const { data } = this.props;
    const { activeIndex } = this.state;

    return (
      <PanGestureHandler
        onGestureEvent={this.onGestureEvent}
        onHandlerStateChange={this.onGestureEvent}
        waitFor={this.scrollRef}
      >
        <Animated.View ref={this.containerRef} style={{ flex: 1, opacity: 1 }}>
          <ScrollView
            ref={this.scrollRef}
            scrollEnabled={activeIndex === -1}
            scrollEventThrottle={1}
            onScroll={this.onScrollEvent}
          >
            <Animated.Code>
              {() =>
                block([
                  debug('absoluteTranslationY', this.absoluteTranslationY),
                  cond(eq(this.gestureState, GHState.END), [
                    set(this.activeIndex, -1),
                    set(this.activeHoverIndex, -1),
                    set(this.activeItemHeight, 0),
                    set(this.gestureStartPoint, 0),
                    set(this.activeItemAbsoluteY, -1),
                    set(this.translationY, 0),
                    set(this.absoluteTranslationY, 0),
                    set(this.scrolledOffset, 0),
                    call([], this.onDrop)
                  ]),
                  cond(eq(this.animatedIsScrolling, 0), [
                    cond(
                      and(
                        neq(this.activeIndex, -1),
                        neq(this.activeItemAbsoluteY, -1)
                      ),
                      [
                        set(
                          this.activeHoverIndex,
                          sub(
                            round(
                              divide(
                                sub(
                                  add(
                                    this.activeItemAbsoluteY,
                                    this.scrollOffset,
                                    this.translationY
                                  ),
                                  this.viewOffsetTop
                                ),
                                this.activeItemHeight
                              )
                            ),
                            1
                          )
                        )
                      ]
                    ),
                    cond(
                      and(
                        neq(this.activeIndex, -1),
                        lessOrEq(
                          this.absoluteTranslationY,
                          add(
                            this.viewOffsetTop,
                            multiply(this.activeItemHeight, 0.5)
                          )
                        )
                      ),
                      call(
                        [this.scrollOffset, this.activeItemHeight],
                        this.scrollUp
                      )
                    ),
                    cond(
                      and(
                        neq(this.activeIndex, -1),
                        greaterOrEq(
                          this.absoluteTranslationY,
                          sub(
                            wHeight,
                            this.viewOffsetTop,
                            multiply(this.activeItemHeight, 0.3)
                          )
                        )
                      ),
                      call(
                        [this.scrollOffset, this.activeItemHeight],
                        this.scrollDown
                      )
                    )
                  ])
                ])
              }
            </Animated.Code>
            {data.map((item, index) => this.renderItem({ item, index }))}
          </ScrollView>
        </Animated.View>
      </PanGestureHandler>
    );
  }
}

export default DraggableScrollView;
