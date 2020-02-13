/*
 * @flow
 * Copyright (C) 2018 MetaBrainz Foundation
 *
 * This file is part of MusicBrainz, the open internet music database,
 * and is licensed under the GPL version 2, or (at your option) any
 * later version: http://www.gnu.org/licenses/gpl-2.0.txt
 */

import React from 'react';
import type {Node as ReactNode} from 'react';

import {withCatalystContext} from '../../context';
import Layout from '../../layout';
import formatUserDate from '../../utility/formatUserDate';

import SearchForm from './SearchForm';

type Props = {
  +$c: CatalystContextT,
  +children: ReactNode,
  +form: SearchFormT,
  +lastUpdated?: string,
};

const ResultsLayout = ({$c, children, form, lastUpdated}: Props) => (
  <Layout fullWidth title={l('Search Results')}>
    <div id="content">
      <h1>{l('Search Results')}</h1>
      {lastUpdated ? (
        <p>
          {texp.l(
            'Last updated: {date}',
            {date: formatUserDate($c, lastUpdated)},
          )}
        </p>
      ) : null}
      {children}
      <SearchForm form={form} />
    </div>
  </Layout>
);

export default withCatalystContext(ResultsLayout);
