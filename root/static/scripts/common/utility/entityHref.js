/*
 * @flow
 * Copyright (C) 2015 MetaBrainz Foundation
 *
 * This file is part of MusicBrainz, the open internet music database,
 * and is licensed under the GPL version 2, or (at your option) any
 * later version: http://www.gnu.org/licenses/gpl-2.0.txt
 */

import ko from 'knockout';

import {ENTITIES} from '../constants';

import nonEmpty from './nonEmpty';

const leadingSlash = /^\/?(.*)/;

type LinkableEntity =
  | {+discid: string, +entityType: 'cdstub', ...}
  | {+entityType: 'editor', +name: string, ...}
  | {+entityType: 'isrc', +isrc: string, ...}
  | {+entityType: 'iswc', +iswc: string, ...}
  | {+entityType: CoreEntityTypeT | 'collection', +gid: string, ...};

function entityHref(
  entity: LinkableEntity,
  subPath?: string,
) {
  const entityProps = ENTITIES[entity.entityType];
  let href = '/' + entityProps.url + '/';
  let id = '';

  switch (entity.entityType) {
    case 'isrc':
      id = entity.isrc;
      break;

    case 'iswc':
      id = entity.iswc;
      break;

    case 'cdstub':
      id = entity.discid;
      break;

    case 'editor':
      id = entity.name;
      break;

    default:
      if (entityProps.mbid && entity.gid) {
        id = ko.unwrap(entity.gid);
      }
  }

  href += encodeURIComponent(id);

  if (nonEmpty(subPath)) {
    subPath = subPath.replace(leadingSlash, '$1');
    if (subPath) {
      href += '/' + subPath;
    }
  }

  return href;
}

export default entityHref;
