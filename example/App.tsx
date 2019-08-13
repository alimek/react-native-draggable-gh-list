import React, { useState } from 'react';
import { StyleSheet, Text, SafeAreaView, View } from 'react-native';
import DraggableList from '../src';
import { TouchableOpacity } from 'react-native-gesture-handler';

export default function App() {
  const [data, setData] = useState(
    [...Array(25)].map((d, index) => ({
      key: `item-${index}`,
      label: index,
      backgroundColor: `rgb(${Math.floor(Math.random() * 255)}, ${index *
        5}, ${132})`
    }))
  );

  return (
    <SafeAreaView style={styles.container}>
      <View
        style={{
          height: 50
        }}
      />
      <DraggableList
        data={data}
        extractKey={item => item.label}
        renderItem={({ item, startDrag }) => (
          <View
            style={{
              height: 100,
              backgroundColor: item.backgroundColor,
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative'
            }}
          >
            <Text
              style={{
                fontWeight: 'bold',
                color: 'white',
                fontSize: 32
              }}
            >
              {item.label}
            </Text>
            <View
              style={{
                position: 'absolute',
                right: 10,
                // top: '50%',
                backgroundColor: 'transparent',
                marginTop: -25
              }}
            >
              <TouchableOpacity onPressIn={startDrag} activeOpacity={1}>
                <Text
                  style={{
                    backgroundColor: 'yellow',
                    justifyContent: 'center',
                    textAlign: 'center',
                    padding: 15
                  }}
                >
                  Order
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        onMoveEnd={({ data }) => setData(data)}
      />
      <View
        style={{
          height: 30
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  }
});
