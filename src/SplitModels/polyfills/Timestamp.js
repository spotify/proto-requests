export const $root = {};
export let Timestamp = {};

$root.google = (function() {
  /**
   * Namespace google.
   * @exports google
   * @namespace
   */
  var google = {};

  google.protobuf = (function() {
    /**
     * Namespace protobuf.
     * @memberof google
     * @namespace
     */
    var protobuf = {};

    protobuf.Timestamp = (function() {
      /**
       * Properties of a Timestamp.
       * @memberof google.protobuf
       * @interface ITimestamp
       * @property {string|null} [timestamp] Timestamp timestamp
       * @property {string|null} [setTimestamp] Timestamp setTimestamp
       */

      /**
       * Constructs a new Timestamp.
       * @memberof google.protobuf
       * @classdesc Represents a Timestamp.
       * @implements ITimestamp
       * @constructor
       * @param {google.protobuf.ITimestamp=} [properties] Properties to set
       */
      function Timestamp(properties) {
        if (properties)
          for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
            if (properties[keys[i]] != null)
              this[keys[i]] = properties[keys[i]];
      }

      /**
       * Timestamp timestamp.
       * @member {string} timestamp
       * @memberof google.protobuf.Timestamp
       * @instance
       */
      Timestamp.prototype.timestamp = (new Date(0)).toISOString();

      /**
       * Sets timestamp
       * @function setTimestamp
       * @memberof google.protobuf.Timestamp
       * @param {string} value
       * @instance
       * @returns {google.protobuf.Timestamp} Timestamp
       */
      Timestamp.prototype.setTimestamp = function(value) {
        this['timestamp'] = value;
        return this;
      };

      /**
       * Converts the Timestamp to an object
       * @function toObject
       * @memberof google.protobuf.Timestamp
       * @instance
       * @returns {object} object
       */
      Timestamp.prototype.toObject = function() {
        return JSON.parse(JSON.stringify(this));
      };

      /**
       * Converts the Timestamp to a JSON string
       * @function toJSON
       * @memberof google.protobuf.Timestamp
       * @instance
       * @returns {string} string
       */
      Timestamp.prototype.toJSON = function() {
        return this['timestamp'];
      };

      return Timestamp;
    })();

    Timestamp = protobuf.Timestamp;

    return protobuf;

  })();


  return google;

})();


export default $root;
