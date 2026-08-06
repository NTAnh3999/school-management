import { RouterProvider } from "react-router";
import { ConfigProvider, App as AntApp } from "antd";
import { router } from "./routes";
import { antTheme } from "./theme";

export default function App() {
  return (
    <ConfigProvider theme={antTheme}>
      <AntApp>
        <RouterProvider router={router} />
      </AntApp>
    </ConfigProvider>
  );
}
