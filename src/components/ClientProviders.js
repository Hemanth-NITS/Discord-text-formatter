"use client";

import { MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import "@mantine/notifications/styles.css";

export default function ClientProviders({ children }) {
  return (
    <MantineProvider theme={{ colorScheme: "dark" }} withGlobalStyles withNormalizeCSS>
      <Notifications zIndex={9999} />
      {children}
    </MantineProvider>
  );
}
