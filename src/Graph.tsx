import React, { Component } from 'react';
import { Table } from '@finos/perspective';
import { ServerRespond } from './DataStreamer';
import './Graph.css';

/**
 * Props declaration for <Graph />
 */
interface IProps {
  data: ServerRespond[],
}

/**
 * Perspective library adds load to HTMLElement prototype.
 * This interface acts as a wrapper for Typescript compiler.
 */
interface PerspectiveViewerElement extends HTMLElement{
  load: (table: Table) => void,
}

/**
 * React component that renders Perspective based on data
 * parsed from its parent through data property.
 */
class Graph extends Component<IProps, {}> {
  // Perspective table
  table: Table | undefined;

  render() {
    return React.createElement('perspective-viewer');
  }

  componentDidMount() {
    // Get element to attach the table from the DOM.
    const elem = document.getElementsByTagName('perspective-viewer')[0] as unknown as PerspectiveViewerElement;

    const schema = {
      stock: 'string',
      top_ask_price: 'float',
      top_bid_price: 'float',
      timestamp: 'date',
    };

    if (window.perspective && window.perspective.worker()) {
      this.table = window.perspective.worker().table(schema);
    }
    if (this.table) {
      // Load the `table` in the `<perspective-viewer>` DOM reference.

      // Add more Perspective configurations here.
      elem.load(this.table);
      elem.setAttribute('view', 'y_line');
      // ‘view’ is the kind of graph we want to visualize the data with. Initially, we were using a grid type. However, since we want a continuous line graph we’re using a y_line.

      elem.setAttribute('column-pivots', '["stock"]');
      //‘column-pivots’ is what will allow us to distinguish stock ABC from DEF. We use ‘[“stock”]’ as its value here.

      elem.setAttribute('row-pivots', '["timestamp"]');
      // ‘row-pivots’ takes care of our x-axis. This allows us to map each datapoint based on its timestamp. Without this, the x-axis would be blank.

      elem.setAttribute('columns', '["top_ask_price"]');
      // columns’ allows us to focus on a particular part of a stock’s data along the y-axis. Without this, the graph would plot different data points of a stock, i.e.: top_ask_price, top_bid_price, stock, timestamp. For this instance we only care about top_ask_price

      elem.setAttribute('aggregates','{"stock":"distinct count", "top_ask_price":"avg", "top_bid_price":"avg","timestamp":"distinct count"}');
      // ‘aggregates’ allows us to handle the duplicated data we observed earlier and consolidate it into a single data point. In our case we only want to consider a data point unique if it has a unique stock name and timestamp. If there are duplicates like what we had before, we want to average out the top_bid_prices and the top_ask_prices of these ‘similar’ data points before treating them as one.
      
    }
  }

  componentDidUpdate() {
    // Everytime the data props is updated, insert the data into Perspective table
    if (this.table) {
      // As part of the task, you need to fix the way we update the data props to
      // avoid inserting duplicated entries into Perspective table again.
      this.table.update(this.props.data.map((el: any) => {
        // Format the data from ServerRespond to the schema
        return {
          stock: el.stock,
          top_ask_price: el.top_ask && el.top_ask.price || 0,
          top_bid_price: el.top_bid && el.top_bid.price || 0,
          timestamp: el.timestamp,
        };
      }));
    }
  }
}

export default Graph;
