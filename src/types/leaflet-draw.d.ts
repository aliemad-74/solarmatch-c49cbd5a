/* eslint-disable @typescript-eslint/no-explicit-any */
import "leaflet";

declare module "leaflet" {
  namespace DrawEvents {
    interface Created {
      layer: L.Layer;
      layerType: string;
    }
    interface Edited {
      layers: L.LayerGroup;
    }
    interface Deleted {
      layers: L.LayerGroup;
    }
  }
}

declare module "react-leaflet-draw" {
  import { ComponentType } from "react";
  
  export interface EditControlProps {
    position?: "topleft" | "topright" | "bottomleft" | "bottomright";
    onCreated?: (e: any) => void;
    onEdited?: (e: any) => void;
    onDeleted?: (e: any) => void;
    draw?: any;
    edit?: any;
  }
  
  export const EditControl: ComponentType<EditControlProps>;
}
