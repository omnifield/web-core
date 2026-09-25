import { index, rootRoute, route } from "@web-core/router/virtual-file-routes";

export default rootRoute("__root.tsx", [
  index("../pages/demo/route.tsx"),
  route("/controls", "../pages/controls/route.tsx"),
  route("/users", "../pages/users/route.tsx"),
]);
