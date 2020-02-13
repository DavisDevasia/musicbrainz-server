/*
 * @flow
 * Copyright (C) 2019 MetaBrainz Foundation
 *
 * This file is part of MusicBrainz, the open internet music database,
 * and is licensed under the GPL version 2, or (at your option) any
 * later version: http://www.gnu.org/licenses/gpl-2.0.txt
 */

import * as React from 'react';

import SelectField from '../../../../components/SelectField';
import {addColonText} from '../i18n/addColon';

export type FilterFormT = $ReadOnly<{
  ...FormT<{
    +artist_credit_id: ReadOnlyFieldT<number>,
    +name: ReadOnlyFieldT<string>,
    +type_id?: ReadOnlyFieldT<number>,
  }>,
  entity_type: 'recording' | 'release' | 'release_group',
  options_artist_credit_id: SelectOptionsT,
  options_type_id?: SelectOptionsT,
}>;

type Props = {
  +form: FilterFormT,
};

function getSubmitText(type: string) {
  switch (type) {
    case 'recording':
      return l('Filter recordings');
    case 'release':
      return l('Filter releases');
    case 'release_group':
      return l('Filter release groups');
  }
  return '';
}

const FilterForm = ({form}: Props) => {
  const typeIdField = form.field.type_id;
  const typeIdOptions = form.options_type_id;
  const artistCreditIdField = form.field.artist_credit_id;
  const artistCreditIdOptions = form.options_artist_credit_id;

  return (
    <div id="filter">
      <form method="get">
        <table>
          <tbody>
            {typeIdField && typeIdOptions ? (
              <tr>
                <td style={{whiteSpace: 'nowrap'}}>
                  {addColonText(l('Type'))}
                </td>
                <td>
                  <SelectField
                    field={typeIdField}
                    options={{grouped: false, options: typeIdOptions}}
                    style={{maxWidth: '40em'}}
                    uncontrolled
                  />
                </td>
              </tr>
            ) : null}

            {artistCreditIdField && artistCreditIdOptions ? (
              <tr>
                <td style={{whiteSpace: 'nowrap'}}>
                  {l('Artist credit:')}
                </td>
                <td>
                  <SelectField
                    field={artistCreditIdField}
                    options={{
                      grouped: false,
                      options: artistCreditIdOptions,
                    }}
                    style={{maxWidth: '40em'}}
                    uncontrolled
                  />
                </td>
              </tr>
            ) : null}

            <tr>
              <td>{addColonText(l('Name'))}</td>
              <td>
                <input
                  defaultValue={form.field.name.value}
                  name={form.field.name.html_name}
                  size="47"
                  type="text"
                />
              </td>
            </tr>
            <tr>
              <td />
              <td>
                <span className="buttons">
                  <button className="submit positive" type="submit">
                    {getSubmitText(form.entity_type)}
                  </button>
                  <button
                    className="submit negative"
                    name="filter.cancel"
                    type="submit"
                    value="1"
                  >
                    {l('Cancel')}
                  </button>
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </form>
    </div>
  );
};

export default FilterForm;
