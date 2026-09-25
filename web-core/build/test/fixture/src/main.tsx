import { mountApp } from "@web-core/solid/mount";

import { Counter } from "./counter";
import { Globbed } from "./globbed";
import { NestedCjs } from "./nested-cjs";

mountApp(() => (
  <>
    <Counter />
    <Globbed />
    <NestedCjs />
  </>
));
