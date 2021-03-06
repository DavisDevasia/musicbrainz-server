/*
 * @flow
 * Copyright (C) 2018 MetaBrainz Foundation
 *
 * This file is part of MusicBrainz, the open internet music database,
 * and is licensed under the GPL version 2, or (at your option) any
 * later version: http://www.gnu.org/licenses/gpl-2.0.txt
 */

import React from 'react';

import EntityHeader from '../components/EntityHeader';
import EntityLink from '../static/scripts/common/components/EntityLink';

type Props = {
  page: string,
  url: UrlT,
};

const UrlHeader = ({url, page}: Props) => (
  <EntityHeader
    entity={url}
    headerClass="urlheader"
    heading={
      <EntityLink content={url.decoded} entity={url} />
    }
    page={page}
    subHeading={l('URL')}
  />
);

export default UrlHeader;
