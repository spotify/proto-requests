const global = require("global");
global.fetch = require('node-fetch');
global.Headers = require('fetch-headers');

const setAuthUrl = require('@spotify-internal/adstudio-webgate-fetch').setAuthUrl;
setAuthUrl('https://adgen-dev.spotify.com/auth');

const { DraftStatus } = require("../generated/com/spotify/ads/adstudiodrafts/DraftStatus");
const { SortDirection } = require("../generated/com/spotify/ads/adstudiodrafts/SortDirection");
const { Column } = require("../generated/com/spotify/adstudiobff/proto/Column");

const { GetDraftsRequest } = require("../generated/com/spotify/adstudiobff/proto/GetDraftsRequest");
const { Draft } = require("../generated/com/spotify/ads/adstudiodrafts/Draft.js");

const request = new GetDraftsRequest()
    .setAdAccountId('test-ad-account-id')
    .setLimit(20)
    .setOffset(0)
    .setStatus(DraftStatus.ACTIVE)
    .setSortDirection(SortDirection.DESC)
    .setOrderBy(Column.UPDATED)
    .setSearchWord("Test")
    .toObject();

console.log('request', request);

// interface Timestamp2 {
//     greeting: string;
//     duration?: number;
//     color?: string;
// }
//
// namespace google.protobuf {
//     declare class Timestamp {
//         constructor(isoString: string);
//
//         isoString: string;
//         toString(): string;
//     }
// }
//
// const draft = new Draft()
//     .setStartDate(new google.protobuf.Timestamp("hey"))
//     .setEndDate(new google.protobuf.Timestamp("hey"));

