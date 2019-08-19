import * as React from 'react';
import {
  FlatList,
  PanGestureHandler,
  State as GHState,
} from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';
import { Dimensions, FlatListProps, View, ViewStyle } from 'react-native';

import RowItem from './RowItem';
import SelectedItem from './SelectedItem';

const { height: wHeight } = Dimensions.get('window');

interface OnMoveEnd {
  before: any[];
  from: number;
  to: number;
  after: any[];
}

interface Props {
  data: any[];
  hoverStyle?: ViewStyle;
  onMoveEnd: (data: OnMoveEnd) => void;
  renderItem: ({
    item,
    index,
    startDrag,
    isActive,
  }: {
    item: any;
    index: number;
    startDrag: () => void;
    isActive: boolean;
  }) => React.ReactNode;
  keyExtractor: (item: any, index: number) => string;
  flatListProps?: FlatListProps<any>;
}

interface State {
  isHoverReady: boolean;
  activeIndex: number;
  activeItemHeight: number;
  activeHoverIndex: number;
  lastElementIndex: number;
  itemRefs: React.RefObject<any>[];
  itemTransitions: Animated.Value<number>[];
}

enum ScrollDirection {
  DOWN,
  UP,
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
  onChange,
} = Animated;

const generateRefs = (data: any[]) => data.map(() => React.createRef());
const generateTransition = (data: any[]) =>
  data.map(() => new Animated.Value(0));

class DraggableFlatList extends React.Component<Props, State> {
  containerRef: React.RefObject<View> = React.createRef();
  scrollRef: React.RefObject<FlatList<any>> = React.createRef();

  gestureStartPoint = new Value<number>(0);
  gestureState = new Value<number>(0);

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
          state: this.gestureState,
        },
      },
    ],
    {
      useNativeDriver: true,
    },
  );

  static getDerivedStateFromProps(props: Props, state: State): State {
    return {
      ...state,
      itemRefs: generateRefs(props.data),
      itemTransitions: generateTransition(props.data),
      lastElementIndex: props.data.length - 1,
    };
  }

  constructor(props: Props) {
    super(props);

    this.state = {
      activeIndex: -1,
      activeItemHeight: 0,
      activeHoverIndex: -1,
      isHoverReady: false,
      lastElementIndex: props.data.length - 1,
      itemRefs: generateRefs(props.data),
      itemTransitions: generateTransition(props.data),
    };
  }

  handlePanResponderEnd = (values: any) => {
    const { onMoveEnd, data } = this.props;
    let [initialIndex, finalIndex] = values;

    if (finalIndex < 0) {
      finalIndex = 0;
    }

    if (finalIndex > data.length - 1) {
      finalIndex = data.length - 1;
    }

    this.activeIndex.setValue(-1);
    this.activeHoverIndex.setValue(-1);
    this.activeItemHeight.setValue(0);
    this.gestureStartPoint.setValue(0);
    this.activeItemAbsoluteY.setValue(-1);
    this.translationY.setValue(0);
    this.absoluteTranslationY.setValue(0);
    this.scrolledOffset.setValue(0);
    this.gestureState.setValue(0);
    this.setState({
      activeIndex: -1,
      activeItemHeight: 0,
      activeHoverIndex: -1,
      isHoverReady: false,
    });

    const after = [...data];
    const element = after[initialIndex];
    after.splice(initialIndex, 1);
    after.splice(finalIndex, 0, element);

    if (onMoveEnd) {
      onMoveEnd({
        before: data,
        from: initialIndex,
        to: finalIndex,
        after,
      });
    }

    this.state.itemTransitions.forEach(transition => transition.setValue(0));
  };

  setHoverComponentReady = () => {
    this.setState({
      isHoverReady: true,
    });
  };

  onRowBecomeActive = (index: number) => {
    this.containerRef.current &&
      this.containerRef.current
        // @ts-ignore
        .getNode()
        .measureInWindow(
          (x?: number, y?: number, width?: number, height?: number) => {
            if (y !== undefined && height !== undefined) {
              this.viewOffsetTop.setValue(y);
              this.viewOffsetBottom.setValue(wHeight - y - height);
            }
          },
        );

    this.state.itemRefs[index] &&
      this.state.itemRefs[index].current &&
      this.state.itemRefs[index].current
        // @ts-ignore
        .getNode()
        .measureInWindow(
          (x?: number, y?: number, width?: number, height?: number) => {
            if (y !== undefined && height !== undefined) {
              this.activeItemAbsoluteY.setValue(y);
              this.activeItemHeight.setValue(height);
              this.initialIndex.setValue(index);
              this.activeIndex.setValue(index);
              this.activeHoverIndex.setValue(index);
              this.setState({
                activeIndex: index,
                activeHoverIndex: index,
                activeItemHeight: height,
              });
            }
          },
        );
  };

  renderItem = ({ item, index }: any) => {
    const { renderItem } = this.props;
    const {
      activeIndex,
      activeItemHeight,
      activeHoverIndex,
      isHoverReady,
    } = this.state;
    const component = renderItem({
      item,
      index,
      startDrag: () => this.onRowBecomeActive(index),
      isActive: false,
    });

    return (
      <RowItem
        component={component}
        isHoverReady={isHoverReady}
        activeIndex={activeIndex}
        animatedActiveIndex={this.activeIndex}
        index={index}
        itemRef={this.state.itemRefs[index]}
        activeHoverIndex={activeHoverIndex}
        animatedHoverIndex={this.activeHoverIndex}
        activeItemHeight={activeItemHeight}
      />
    );
  };

  scrollUp = (values: any) => {
    const [offset] = values;

    if (offset > 0) {
      this.scroll(ScrollDirection.UP, values);
    }
  };
  scrollDown = (values: any) => this.scroll(ScrollDirection.DOWN, values);

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
        offset <= 0
          ? this.scrolledOffset
          : sub(this.scrolledOffset, itemHeight),
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
        offset: offset,
      });

    setTimeout(() => {
      this.isScrolling = false;
      this.animatedIsScrolling.setValue(0);
    }, 300);
  };

  onScrollEvent = (event: any) => {
    this.scrollOffset.setValue(event.nativeEvent.contentOffset.y);
  };

  renderSelectedComponent = () => {
    const { activeIndex: index } = this.state;
    const { renderItem, data, hoverStyle } = this.props;

    if (index === -1) {
      return null;
    }

    const item = data[index];
    const component = renderItem({
      item,
      index,
      startDrag: () => {},
      isActive: true,
    });

    return (
      <SelectedItem
        component={component}
        translationY={this.translationY}
        absoluteY={this.activeItemAbsoluteY}
        activeItemHeight={this.activeItemHeight}
        viewOffsetTop={this.viewOffsetTop}
        gestureState={this.gestureState}
        isAnimating={this.isAnimating}
        targetItemPositionY={this.targetItemPositionY}
        activeIndex={this.activeIndex}
        activeHoverIndex={this.activeHoverIndex}
        setHoverComponentReady={this.setHoverComponentReady}
        hoverStyle={hoverStyle}
      />
    );
  };

  onChangedHoverIndex = (value: any) => {
    const index = value[0];
    this.state.itemRefs[index] &&
      this.state.itemRefs[index].current &&
      this.state.itemRefs[index].current
        // @ts-ignore
        .getNode()
        .measureInWindow((x?: number, y?: number) => {
          if (y !== undefined) {
            this.targetItemPositionY.setValue(y);
            this.setState({
              activeHoverIndex: index,
            });
          }
        });
  };

  render() {
    const { data, keyExtractor, flatListProps } = this.props;
    const { activeIndex, activeHoverIndex } = this.state;

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
                  set(this.finalIndex, this.activeHoverIndex),
                ]),
                onChange(
                  this.activeHoverIndex,
                  call([this.activeHoverIndex], this.onChangedHoverIndex),
                ),
                cond(eq(this.isAnimating, 0), [
                  call(
                    [this.initialIndex, this.finalIndex],
                    this.handlePanResponderEnd,
                  ),
                  set(this.isAnimating, -1),
                ]),
                cond(eq(this.animatedIsScrolling, 0), [
                  cond(
                    and(
                      neq(this.activeIndex, -1),
                      neq(this.activeItemAbsoluteY, -1),
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
                                this.translationY,
                              ),
                              this.viewOffsetTop,
                            ),
                            this.activeItemHeight,
                          ),
                        ),
                      ),
                    ],
                  ),
                  cond(
                    and(
                      neq(this.activeIndex, -1),
                      eq(this.gestureState, GHState.ACTIVE),
                      lessOrEq(
                        this.absoluteTranslationY,
                        add(
                          this.viewOffsetTop,
                          multiply(this.activeItemHeight, 0.5),
                        ),
                      ),
                    ),
                    call(
                      [this.scrollOffset, this.activeItemHeight],
                      this.scrollUp,
                    ),
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
                          multiply(this.activeItemHeight, 0.3),
                        ),
                      ),
                    ),
                    call(
                      [this.scrollOffset, this.activeItemHeight],
                      this.scrollDown,
                    ),
                  ),
                ]),
              ])
            }
          </Animated.Code>
          <FlatList
            {...flatListProps}
            data={data}
            renderItem={info => this.renderItem(info)}
            ref={this.scrollRef}
            scrollEnabled={activeIndex === -1}
            scrollEventThrottle={1}
            onScroll={this.onScrollEvent}
            keyExtractor={(item, index) =>
              `${keyExtractor(item, index)}-index-${index}`
            }
            extraData={{
              activeHoverIndex,
              activeIndex,
            }}
          />
          {this.renderSelectedComponent()}
        </Animated.View>
      </PanGestureHandler>
    );
  }
}

export default DraggableFlatList;
