import { layout, rootRoute, route } from "@web-core/router/virtual-file-routes";

export default rootRoute("__root.tsx", [
  layout("workspace", "../pages/route.tsx", [
    route("/playground", "../pages/playground/route.tsx"),
    route("/lab/{-$component}", "../pages/lab/route.tsx", [
      route("/{-$feature}", "../pages/lab/kitchen/route.tsx"),
    ]),
    route("/showcase", "../pages/showcase/route.tsx", [
      route("/component/{-$name}", "../pages/showcase/component/route.tsx"),
      route("/module/{-$name}", "../pages/showcase/module/route.tsx"),
    ]),
  ]),
  route("/embed/$component/$assembly", "../pages/embed/route.tsx"),
]);
