import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "../../context/AuthContext";
import { useLogin } from "@workspace/api-client-react";
import * as Haptics from "expo-haptics";

export default function LoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const loginMutation = useLogin();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Error", "Please enter your email and password");
      return;
    }
    try {
      const result = await loginMutation.mutateAsync({ data: { email: email.trim(), password } });
      await login(result.token);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/(tabs)");
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Login Failed", "Invalid email or password");
    }
  };

  const s = styles(colors, topPad, bottomPad);

  return (
    <View style={s.container}>
      <KeyboardAwareScrollViewCompat
        contentContainerStyle={s.scrollContent}
        keyboardShouldPersistTaps="handled"
        bottomOffset={20}
      >
        <View style={s.header}>
          <View style={s.logoContainer}>
            <Text style={s.logoText}>SPH</Text>
          </View>
          <Text style={s.title}>Welcome back</Text>
          <Text style={s.subtitle}>Your study hub awaits</Text>
        </View>

        <View style={s.form}>
          <View style={s.fieldGroup}>
            <Text style={s.label}>Email</Text>
            <TextInput
              style={s.input}
              value={email}
              onChangeText={setEmail}
              placeholder="you@university.edu"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={s.fieldGroup}>
            <Text style={s.label}>Password</Text>
            <TextInput
              style={s.input}
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor={colors.mutedForeground}
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            style={[s.button, loginMutation.isPending && s.buttonDisabled]}
            onPress={handleLogin}
            disabled={loginMutation.isPending}
            activeOpacity={0.8}
          >
            {loginMutation.isPending ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={s.buttonText}>Sign In</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={s.footer}>
          <Text style={s.footerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => router.push("/(auth)/register")}>
            <Text style={s.footerLink}>Create one</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAwareScrollViewCompat>
    </View>
  );
}

const styles = (colors: ReturnType<typeof useColors>, topPad: number, bottomPad: number) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scrollContent: {
      flexGrow: 1,
      paddingTop: topPad + 32,
      paddingBottom: bottomPad + 32,
      paddingHorizontal: 24,
      justifyContent: "center",
    },
    header: { alignItems: "center", marginBottom: 48 },
    logoContainer: {
      width: 72,
      height: 72,
      borderRadius: 20,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 24,
    },
    logoText: { color: "#FFF", fontSize: 22, fontFamily: "Inter_700Bold" },
    title: { fontSize: 28, fontFamily: "Inter_700Bold", color: colors.foreground, marginBottom: 8 },
    subtitle: { fontSize: 15, fontFamily: "Inter_400Regular", color: colors.mutedForeground },
    form: { gap: 20, marginBottom: 32 },
    fieldGroup: { gap: 8 },
    label: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: colors.foreground, letterSpacing: 0.3 },
    input: {
      height: 52,
      backgroundColor: colors.card,
      borderRadius: 12,
      paddingHorizontal: 16,
      fontSize: 15,
      fontFamily: "Inter_400Regular",
      color: colors.foreground,
      borderWidth: 1,
      borderColor: colors.border,
    },
    button: {
      height: 52,
      backgroundColor: colors.primary,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 8,
    },
    buttonDisabled: { opacity: 0.6 },
    buttonText: { color: "#FFF", fontSize: 16, fontFamily: "Inter_600SemiBold" },
    footer: { flexDirection: "row", justifyContent: "center", alignItems: "center" },
    footerText: { fontSize: 14, fontFamily: "Inter_400Regular", color: colors.mutedForeground },
    footerLink: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: colors.primary },
  });
