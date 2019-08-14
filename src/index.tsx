import * as React from 'react';
import {
  FlatList,
  PanGestureHandler,
  ScrollView,
  State as GHState
} from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';
import { Dimensions, View } from 'react-native';

import RowItem from './RowItem';
import SelectedItem from './SelectedItem';

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
  sub,
  greaterOrEq,
  block,
  debug,
  onChange
} = Animated;

class DraggableScrollView extends React.Component<Props, State> {
  itemRefs: React.RefObject<any>[];
  containerRef: React.RefObject<View> = React.createRef();
  scrollRef: React.RefObject<FlatList<any>> = React.createRef();

  gestureStartPoint = new Value<number>(0);
  gestureState = new Value<number>(0);

  itemTransitions: Animated.Value<number>[];
  activeItemAbsoluteY = new Value<number>(-1);
  activeItemHeight = new Value<number>(0);
  activeHoverIndex = new Value<number>(-1);
  absoluteTranslationY = new Value<number>(0);
  translationY = new Value<number>(0);
  activeIndex = new Value<number>(-1);
  viewOffsetTop = new Value<number>(-1);
  viewOffsetBottom = new Value<number>(-1);
  scrollOffset = new Value<number>(0);
  scrolledOffset = new Value<number>(0);
  animatedIsScrolling = new Value<number>(0);

  isAnimating = new Value<number>(-1);
  initialIndex = new Value<number>(-1);
  finalIndex = new Value<number>(-1);

  targetItemPositionY = new Value<number>(-1);

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

  handlePanResponderEnd = (values: number[]) => {
    const [initialIndex, finalIndex] = values;
    console.log('clean', {
      initialIndex,
      finalIndex
    });
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
    this.gestureState.setValue(0);
  };

  startDrag = (item: any, index: number) => {
    this.setState({
      activeIndex: index
    });
    this.initialIndex.setValue(index);
    this.onRowBecomeActive(index);
    this.activeIndex.setValue(index);
    this.activeHoverIndex.setValue(index);
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

    this.isScrolling = true;
    this.animatedIsScrolling.setValue(1);
    let offset = currentOffset;

    if (direction === ScrollDirection.UP) {
      offset -= itemHeight;
      this.scrolledOffset.setValue(
        offset <= 0 ? this.scrolledOffset : sub(this.scrolledOffset, itemHeight)
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
      this.scrollRef.current.scrollToOffset({
        animated: true,
        offset: offset
      });

    setTimeout(() => {
      this.isScrolling = false;
      this.animatedIsScrolling.setValue(0);
    }, 300);
  };

  onScrollEvent = event => {
    this.scrollOffset.setValue(event.nativeEvent.contentOffset.y);
  };

  renderSelectedComponent = () => {
    const { activeIndex: index } = this.state;
    const { renderItem, extractKey, data } = this.props;

    if (index === -1) {
      return null;
    }

    const item = data[index];
    const component = renderItem({
      item,
      index,
      startDrag: () => {}
    });

    return (
      <SelectedItem
        component={component}
        translationY={this.translationY}
        scrollOffset={this.scrollOffset}
        absoluteY={this.activeItemAbsoluteY}
        activeItemHeight={this.activeItemHeight}
        viewOffsetTop={this.viewOffsetTop}
        gestureState={this.gestureState}
        isAnimating={this.isAnimating}
        targetItemPositionY={this.targetItemPositionY}
      />
    );
  };

  onChangedHoverIndex = (index) => {
    console.log('onChangedIndex', index[0]);
    this.itemRefs[index] &&
    this.itemRefs[index].current &&
    this.itemRefs[index].current
    // @ts-ignore
      .getNode()
      .measureInWindow((x, y, width, height) => {
        if (y !== undefined) {
          console.log('position', x, y, width, height);
          this.targetItemPositionY.setValue(y);
        }
      });
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
        <Animated.View
          ref={this.containerRef}
          style={{ flex: 1, opacity: 1, position: 'relative' }}
        >
          <Animated.Code>
            {() =>
              block([
                cond(eq(this.gestureState, GHState.END), [
                  set(this.finalIndex, this.activeHoverIndex)
                ]),
                onChange(this.activeHoverIndex, call([this.activeHoverIndex], this.onChangedHoverIndex)),
                cond(eq(this.isAnimating, 0), [
                  call(
                    [this.initialIndex, this.finalIndex],
                    this.handlePanResponderEnd
                  ),
                  set(this.isAnimating, -1)
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
                        )
                      )
                    ]
                  ),
                  cond(
                    and(
                      neq(this.activeIndex, -1),
                      eq(this.gestureState, GHState.ACTIVE),
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
                      eq(this.gestureState, GHState.ACTIVE),
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
          <FlatList
            data={data}
            renderItem={({ item, index }) => this.renderItem({ item, index })}
            ref={this.scrollRef}
            scrollEnabled={activeIndex === -1}
            scrollEventThrottle={1}
            onScroll={this.onScrollEvent}
          />
          {this.renderSelectedComponent()}
        </Animated.View>
      </PanGestureHandler>
    );
  }
}

export default DraggableScrollView;
