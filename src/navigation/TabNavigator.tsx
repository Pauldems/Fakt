import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { InvoiceScreen } from '../features/invoice/InvoiceScreen';
import { InvoiceListScreen } from '../features/invoiceList/InvoiceListScreen';
import { PDFViewerScreen } from '../features/pdfViewer/PDFViewerScreen';
import { SettingsScreen } from '../features/settings/SettingsScreen';
import { View, Platform } from 'react-native';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const InvoiceListStack = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="InvoiceListMain" 
        component={InvoiceListScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="PDFViewer" 
        component={PDFViewerScreen}
        options={{ 
          headerShown: false,
          presentation: 'modal',
          animation: 'slide_from_bottom'
        }}
      />
    </Stack.Navigator>
  );
};

export const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: 'white',
          borderTopWidth: 0,
          elevation: 20,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.1,
          shadowRadius: 10,
          paddingBottom: Platform.OS === 'ios' ? 30 : 10,
          paddingTop: 10,
          height: Platform.OS === 'ios' ? 95 : 70,
        },
        tabBarActiveTintColor: '#003580',
        tabBarInactiveTintColor: '#8e8e93',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
        },
        tabBarIconStyle: {
          marginTop: 2,
        }
      }}
    >
      <Tab.Screen
        name="NewInvoice"
        component={InvoiceScreen}
        options={{
          tabBarLabel: 'Nouvelle',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons 
              name={focused ? "add-circle" : "add-circle-outline"} 
              size={28} 
              color={color} 
            />
          ),
        }}
      />
      <Tab.Screen
        name="InvoiceList"
        component={InvoiceListStack}
        options={{
          tabBarLabel: 'Mes Factures',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons 
              name={focused ? "folder-open" : "folder-outline"} 
              size={28} 
              color={color} 
            />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Paramètres',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons 
              name={focused ? "settings" : "settings-outline"} 
              size={28} 
              color={color} 
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
};