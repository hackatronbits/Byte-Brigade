import { useRouter } from "expo-router";
import React, { useState, useRef, useEffect } from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { Circle, G, Text as TextSvg } from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";
import * as Notifications from "expo-notifications";
import NotificationPanel from "../student-others/notification";
import {
  registerForPushNotifications,
  saveTokenToBackend,
} from "../../utils/notifications.js";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import Constants from "expo-constants";
// Dummy data
const subjects = [
  {
    id: 1,
    name: "DBMS",
    subcode: "SUBCODE",
    professor: "Prof. Name",
    total: 22,
    present: 17,
  },
  {
    id: 2,
    name: "Maths",
    subcode: "MATH101",
    professor: "Prof. Math",
    total: 25,
    present: 20,
  },
  {
    id: 3,
    name: "OS",
    subcode: "OS201",
    professor: "Prof. OS",
    total: 30,
    present: 26,
  },
  {
    id: 4,
    name: "CN",
    subcode: "CN301",
    professor: "Prof. CN",
    total: 28,
    present: 25,
  },
  {
    id: 5,
    name: "AI",
    subcode: "AI401",
    professor: "Prof. AI",
    total: 18,
    present: 15,
  },
];

export default function HomeScreen() {
  useEffect(() => {
    const fetchActiveSession = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        if (!token) {
          console.log("No authentication token found");
          return;
        }

        const API_BASE_URL = Constants.expoConfig?.extra?.apiUrl || "";
        console.log(
          "Fetching active session from:",
          `${API_BASE_URL}/api/v1/attendance/getActiveAttendance`
        );

        const response = await axios.post(
          `${API_BASE_URL}/api/v1/attendance/getActiveAttendance`,
          { token }
        );

        // Log the entire response object to see what's coming back
        console.log("Active session API response:", response);

        // Now specifically log the data part
        console.log("Active session data:", response.data);

        if (
          response.data &&
          response.data.statusCode === 200 &&
          response.data.data
        ) {
          console.log(
            "Valid active session found, navigating to confirmation page"
          );
          router.navigate({
            pathname: "/student-others/confirm",
            params: {
              branch: response.data.data.branch,
              semester: response.data.data.semester,
              subject: response.data.data.subjectName,
              attendanceId: response.data.data.attendanceId,
            },
          });
        } else {
          console.log(
            "No active attendance session or invalid response format"
          );
        }
      } catch (error: any) {
        console.error("Error fetching active attendance:", error);
        // More detailed error logging
        if (error.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          console.error("Error response data:", error.response.data);
          console.error("Error response status:", error.response.status);
          console.error("Error response headers:", error.response.headers);
        } else if (error.request) {
          // The request was made but no response was received
          console.error("Error request:", error.request);
        } else {
          // Something happened in setting up the request that triggered an Error
          console.error("Error message:", error.message);
        }
      }
    };

    fetchActiveSession();
  }, [router]);
  useEffect(() => {
    const fetchUserDeatils = async () => {
      try {
        const API_BASE_URL = Constants.expoConfig?.extra?.apiUrl;
        const token = await AsyncStorage.getItem("token");
        const response = await axios.post(
          `${API_BASE_URL}/api/v1/home/getUser`,
          {
            token,
          }
        );
        const data = await response.data;
        console.log("-data", data);
      } catch (error: any) {
        console.log(error.response);
      }
    };

    fetchUserDeatils();
  }, []);

  const [expoPushToken, setExpoPushToken] = useState<string | undefined>("");
  const notificationListener = useRef<any>();
  const responseListener = useRef<any>();
  const router = useRouter();
  const [expandedId, setExpandedId] = useState(subjects[0].id);
  const [showNotification, setShowNotification] = useState(false);
  const getNotificationToken = async () => {
    const notTokGen = await AsyncStorage.getItem("notTokGen");
    if (notTokGen === "true") return;
    try {
      const token = await registerForPushNotifications();
      setExpoPushToken(token);
      const userToken = await AsyncStorage.getItem("token");
      if (token) {
        console.log("Push notification token generated:", token);
        const response = await saveTokenToBackend(token, userToken);
        console.log(response.statusCode);
        if (response.statusCode === 200) {
          await AsyncStorage.setItem("notTokGen", "true");
        }
      }
    } catch (error) {
      console.error("Error registering for push notifications:", error);
    }
  };
  getNotificationToken();
  // Set up notification listeners
  notificationListener.current = Notifications.addNotificationReceivedListener(
    (notification) => {
      console.log("Notification received:", notification);
      // Handle received notification
    }
  );
  responseListener.current =
    Notifications.addNotificationResponseReceivedListener((response) => {
      console.log("Notification tapped:", response);
      // Handle notification tap/response
    });

  const toggleExpand = (id: number) => setExpandedId(id);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headerRow}>
          <Text style={styles.header}>Hello, Student 1</Text>
          <TouchableOpacity onPress={() => setShowNotification(true)}>
            <Ionicons name="notifications-outline" size={32} color="black" />
          </TouchableOpacity>
        </View>

        {subjects.map((subject) => (
          <SubjectTile
            key={subject.id}
            subject={subject}
            expanded={expandedId === subject.id}
            onPress={() => toggleExpand(subject.id)}
            onViewDetails={() => router.push("/student-others/attendance")}
          />
        ))}
      </ScrollView>

      <NotificationPanel
        visible={showNotification}
        onClose={() => setShowNotification(false)}
      />
    </SafeAreaView>
  );
}

type Subject = {
  id: number;
  name: string;
  subcode: string;
  professor: string;
  total: number;
  present: number;
};

type SubjectTileProps = {
  subject: Subject;
  expanded: boolean;
  onPress: () => void;
  onViewDetails: () => void;
};

function SubjectTile({
  subject,
  expanded,
  onPress,
  onViewDetails,
}: SubjectTileProps) {
  const { name, subcode, professor, total, present } = subject;
  const absent = total - present;
  const percentage = Math.round((present / total) * 100);

  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const dashArray = (absent / total) * circumference;
  const chartSize = expanded ? 100 : 60;
  const strokeWidth = 20;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      style={styles.tileWrapper}
    >
      <View style={[styles.tile, expanded && styles.tileExpanded]}>
        <View style={styles.tileHeader}>
          <View style={styles.leftSection}>
            <Text style={styles.subjectName}>{name}</Text>
            <Text style={styles.subDetails}>{subcode}</Text>
            <Text style={styles.subDetails}>{professor}</Text>

            {expanded && (
              <TouchableOpacity
                style={styles.viewButton}
                onPress={onViewDetails}
              >
                <Text style={styles.buttonText}>View Details</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.rightSection}>
            <Svg height={chartSize} width={chartSize} viewBox="0 0 100 100">
              <G rotation={-90} origin="50, 50">
                <Circle
                  cx="50"
                  cy="50"
                  r={radius}
                  stroke="#e0e0e0"
                  strokeWidth={strokeWidth}
                  fill="none"
                />
                <Circle
                  cx="50"
                  cy="50"
                  r={radius}
                  stroke="#e55373"
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${dashArray} ${circumference}`}
                  strokeDashoffset="0"
                  strokeLinecap="round"
                  fill="none"
                />
              </G>
              <TextSvg
                x="50"
                y="55"
                fontSize={expanded ? "20" : "16"}
                fill="#000"
                textAnchor="middle"
                fontWeight="bold"
              >
                {percentage}%
              </TextSvg>
            </Svg>

            {expanded && (
              <View style={styles.attendanceDetails}>
                <Text style={styles.detailText}>Total Classes : {total}</Text>
                <Text style={styles.detailText}>Present : {present}</Text>
                <Text style={styles.detailText}>Absent : {absent}</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  container: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
    marginBottom: 24,
  },
  header: {
    fontSize: 22,
    fontWeight: "700",
    color: "#222",
  },
  tileWrapper: {
    marginBottom: 16,
  },
  tile: {
    backgroundColor: "#f9f9f9",
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 6,
  },
  tileExpanded: {
    paddingVertical: 24,
  },
  tileHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  leftSection: {
    flex: 1,
    justifyContent: "center",
  },
  rightSection: {
    alignItems: "center",
    justifyContent: "center",
    minWidth: 90,
  },
  subjectName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  subDetails: {
    color: "#666",
    fontSize: 12,
  },
  attendanceDetails: {
    alignItems: "flex-start",
    marginTop: 8,
  },
  detailText: {
    fontSize: 13,
    color: "#444",
  },
  viewButton: {
    backgroundColor: "#e55373",
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 14,
    marginTop: 16,
    alignSelf: "flex-start",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 13,
  },
});
