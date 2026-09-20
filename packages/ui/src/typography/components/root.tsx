import { Polymorphic, type PolymorphicProps } from "@kobalte/core/polymorphic";
import { splitProps, type ValidComponent } from "solid-js";

import { useAddress, slotAware } from "../../shared/utils/slot-chain.js";
import { useKitLife } from "../../shared/utils/skin-life.js";
import { passport } from "../entity/passport.js";
import { anatomyParts } from "../entity/anatomy.js";

export type TypographyProps<T extends ValidComponent = "p"> = PolymorphicProps<T> & {
  truncated?: boolean;
};

export const Typography = slotAware(function Typography<T extends ValidComponent = "p">(
  props: TypographyProps<T>,
) {
  useKitLife(passport, props);

  const [local, others] = splitProps(props, ["truncated"]);
  const [address, rest] = useAddress(others, anatomyParts.root.attrs);

  return <Polymorphic as="p" {...rest} {...address} data-truncated={local.truncated ? "true" : undefined} />;
});
